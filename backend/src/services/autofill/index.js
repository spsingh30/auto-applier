// Autofill orchestrator: find the form with Puppeteer (including inside iframes) -> AI decides -> fill.
// The goal is NOT to SUBMIT yet — only FILL and return a screenshot.
const puppeteer = require('puppeteer');
const { scrapeForm } = require('./scrapeForm');
const { aiDecideFills } = require('./aiFill');
const { getResumePath } = require('../resumeStore');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Apply the AI's decisions into the actual form frame.
// Instead of click/keyboard we use the native value-setter + input/change events —
// this avoids viewport/clickability issues and also updates React forms.
async function applyFills(frame, fills) {
  const done = [];
  for (const { selector, value } of fills) {
    try {
      const ok = await frame.evaluate((sel, val) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        const type = (el.getAttribute('type') || '').toLowerCase();
        el.scrollIntoView({ block: 'center' });

        if (tag === 'select') {
          const opt = Array.from(el.options).find((o) => (o.value || o.text) === val);
          if (!opt) return false;
          el.value = opt.value || opt.text;
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        if (type === 'checkbox' || type === 'radio') {
          if (val === 'true' || val === 'on') {
            el.checked = true;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
          return true;
        }
        // text / textarea / email / tel — React-friendly native setter.
        const proto = tag === 'textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }, selector, value);

      if (ok) done.push({ selector, value });
    } catch {
      // one field fails -> continue with the rest
    }
  }
  return done;
}

// Attach the actual resume to the Resume/CV file input. Prefer the input whose
// label contains "resume/cv", otherwise the first file input. Returns true if attached.
async function uploadResumeFile(frame, fileFields, resumePath) {
  if (!fileFields || !fileFields.length || !resumePath) return false;
  const pick =
    fileFields.find((f) => /resume|cv|curriculum vitae/i.test(f.label)) || fileFields[0];
  if (!pick) return false;
  try {
    const handle = await frame.$(pick.selector);
    if (!handle) return false;
    await handle.uploadFile(resumePath);
    // Notify React/ATS that the file has been attached.
    await frame.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, pick.selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} jobUrl
 * @param {object} profile
 * @returns {Promise<{ jobUrl, fields, filled, resumeUploaded, screenshot }>}
 */
async function autofillJob(jobUrl, profile) {
  if (!jobUrl) throw new Error('jobUrl is required');
  if (!profile) throw new Error('Profile not found — please upload a resume first');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1280, height: 1600 });

    const { frame, fields, fileFields } = await scrapeForm(page, jobUrl);
    if (!frame || !fields.length) {
      throw new Error('No fillable form fields found on this page (it may be a login/custom portal).');
    }

    const fills = await aiDecideFills(fields, profile);
    const filled = await applyFills(frame, fills);

    // Attach the actual resume to the Resume/CV file input (if the form asks for it and a file is saved).
    const resumeUploaded = await uploadResumeFile(frame, fileFields, getResumePath(profile));

    // Capture the full page — the form is often below the fold (in an iframe).
    const screenshot = await page.screenshot({ encoding: 'base64', fullPage: true }).catch(
      () => page.screenshot({ encoding: 'base64', fullPage: false })
    );
    return { jobUrl, fields, filled, resumeUploaded, screenshot };
  } finally {
    await browser.close();
  }
}

module.exports = { autofillJob };
