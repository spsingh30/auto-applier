// Opens the job apply page with Puppeteer and extracts the form fields.
// IMPORTANT: the form is often inside an IFRAME (Greenhouse embed, etc.) —
// so we check all frames, and the one with the most fields is the real form.

const APPLY_HINTS = ['apply for this job', 'apply now', 'apply', 'submit application'];

// Text hints for cookie/consent banner buttons. We prioritize "reject/decline"
// (privacy-friendly), otherwise dismiss the banner with "accept/agree".
const COOKIE_ACCEPT_HINTS = [
  'accept all', 'accept all cookies', 'allow all', 'i accept', 'accept cookies',
  'accept', 'agree', 'got it', 'ok', 'allow',
];
const COOKIE_REJECT_HINTS = [
  'reject all', 'decline all', 'reject', 'decline', 'only necessary',
  'necessary only', 'essential only',
];

// Dismiss the cookie banner (Reject first, otherwise Accept). The banner may live in
// a separate iframe (OneTrust/Cookiebot/Osano) — so we check all frames.
async function dismissCookieBanners(page) {
  for (const frame of page.frames()) {
    try {
      const clicked = await frame.evaluate((accepts, rejects) => {
        const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const cands = Array.from(
          document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]')
        ).filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0; // only visible buttons
        });

        const find = (hints) =>
          cands.find((el) => {
            const t = norm(el.innerText || el.value || el.getAttribute('aria-label'));
            return t && t.length < 40 && hints.some((h) => t === h || t.includes(h));
          });

        const btn = find(rejects) || find(accepts);
        if (btn) { btn.click(); return norm(btn.innerText || btn.value); }
        return null;
      }, COOKIE_ACCEPT_HINTS, COOKIE_REJECT_HINTS);

      if (clicked) return clicked; // one banner dismissed, done
    } catch {
      // cross-origin / detached frame — skip
    }
  }
  return null;
}

// Extract the fillable fields of a frame (or page). Both Frame and Page have .evaluate.
async function extractFieldsFromFrame(frame) {
  return frame.evaluate(() => {
    function selectorFor(el, idx) {
      if (el.id) return `#${CSS.escape(el.id)}`;
      if (el.name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
      return `[data-autofill-idx="${idx}"]`;
    }
    function labelFor(el) {
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
      // aria-labelledby -> text of the referenced element(s)
      const lblby = el.getAttribute('aria-labelledby');
      if (lblby) {
        const txt = lblby.split(/\s+/).map((id) => (document.getElementById(id) || {}).innerText || '').join(' ').trim();
        if (txt) return txt;
      }
      if (el.id) {
        const lab = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (lab) return lab.innerText.trim();
      }
      const wrap = el.closest('label');
      if (wrap) return wrap.innerText.trim();
      // Custom dropdowns (react-select): the label is often in a parent container. Walk upward.
      let node = el.parentElement;
      for (let i = 0; i < 4 && node; i++) {
        const lab = node.querySelector('label, legend');
        if (lab && lab.innerText.trim()) return lab.innerText.trim();
        node = node.parentElement;
      }
      if (el.placeholder) return el.placeholder;
      return el.name || '';
    }

    const els = Array.from(document.querySelectorAll('input, textarea, select'));
    const out = [];
    let idx = 0;
    for (const el of els) {
      const type = (el.getAttribute('type') || el.tagName).toLowerCase();
      // skip: non-fillable + search boxes (forms can contain search inputs too).
      if (['hidden', 'submit', 'button', 'image', 'reset', 'file', 'password', 'search'].includes(type)) continue;
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      const ph = (el.placeholder || '').toLowerCase();
      if (el.getAttribute('role') === 'searchbox' || aria === 'search' || ph === 'search') continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      el.setAttribute('data-autofill-idx', String(idx));
      const field = {
        selector: selectorFor(el, idx),
        label: (labelFor(el) || '').slice(0, 160),
        type,
        required: el.required || el.getAttribute('aria-required') === 'true',
      };
      if (el.tagName.toLowerCase() === 'select') {
        field.options = Array.from(el.options).map((o) => o.value || o.text).filter(Boolean).slice(0, 40);
      }
      out.push(field);
      idx++;
    }
    return out;
  });
}

// Extract file inputs (Resume/CV) separately — the AI doesn't fill these, Puppeteer attaches them.
// We do NOT apply a visibility filter: these are often hidden (behind a custom "Attach" button).
async function extractFileFields(frame) {
  try {
    return await frame.evaluate(() => {
      const els = Array.from(document.querySelectorAll('input[type="file"]'));
      return els.map((el, i) => {
        el.setAttribute('data-autofill-file-idx', String(i));
        let label = el.getAttribute('aria-label') || '';
        if (!label && el.id) {
          const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
          if (l) label = l.innerText.trim();
        }
        if (!label) {
          const w = el.closest('label');
          if (w) label = w.innerText.trim();
        }
        if (!label) {
          let n = el.parentElement;
          for (let k = 0; k < 4 && n; k++) {
            const l = n.querySelector('label, legend');
            if (l && l.innerText.trim()) { label = l.innerText.trim(); break; }
            n = n.parentElement;
          }
        }
        const sel = el.id
          ? `#${CSS.escape(el.id)}`
          : el.name
          ? `input[name="${CSS.escape(el.name)}"]`
          : `[data-autofill-file-idx="${i}"]`;
        return { selector: sel, label: (label || '').slice(0, 160) };
      });
    });
  } catch {
    return [];
  }
}

// Among all frames, return the one with the most fillable fields + its fields.
async function bestFrameFields(page) {
  let best = null;
  let bestFields = [];
  for (const frame of page.frames()) {
    try {
      const fields = await extractFieldsFromFrame(frame);
      if (fields.length > bestFields.length) {
        best = frame;
        bestFields = fields;
      }
    } catch {
      // cross-origin / detached frame — skip
    }
  }
  return { frame: best, fields: bestFields };
}

/**
 * Open jobUrl and scrape the fields of the real form (even if it's in an iframe).
 * @returns {Promise<{ frame, fields }>}  frame = the one to fill in
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scrapeForm(page, jobUrl) {
  // domcontentloaded is fast; networkidle gets stuck on tracking/recaptcha frames.
  await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });

  // Dismiss the cookie/consent banner first — otherwise it covers the form
  // (bad screenshot + sometimes blocks clicks). The banner loads a bit late, so try twice.
  await sleep(800);
  let cookie = await dismissCookieBanners(page);
  if (!cookie) { await sleep(1500); cookie = await dismissCookieBanners(page); }

  // Poll until the form (even if in an iframe) renders — max ~14s.
  let result = { frame: null, fields: [] };
  for (let i = 0; i < 14; i++) {
    result = await bestFrameFields(page);
    if (result.fields.length >= 3) break;
    // Try the banner again each round (consent loads late or appears on scroll).
    if (!cookie) cookie = await dismissCookieBanners(page);
    await sleep(1000);
  }

  // Few fields found -> the form may be behind an "Apply" button. Click it and look again.
  if (result.fields.length < 2) {
    const clicked = await page.evaluate((hints) => {
      const cands = Array.from(document.querySelectorAll('a, button, [role="button"]'));
      const btn = cands.find((c) => {
        const t = (c.innerText || c.value || '').trim().toLowerCase();
        return t && hints.some((h) => t.includes(h)) && t.length < 40;
      });
      if (btn) { btn.click(); return true; }
      return false;
    }, APPLY_HINTS);

    if (clicked) {
      await sleep(3000);
      await dismissCookieBanners(page); // a new banner may appear after apply
      result = await bestFrameFields(page);
    }
  }

  // Also extract the Resume/CV file inputs (from the best frame).
  result.fileFields = result.frame ? await extractFileFields(result.frame) : [];

  return result;
}

module.exports = { scrapeForm };
