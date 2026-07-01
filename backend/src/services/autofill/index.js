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

// Attach the actual resume to the Resume/CV file input. We try the candidates in
// priority order (best label/accept match first) and stop at the first one that
// accepts the file. Each fileField carries its own .frame (see scrapeForm).
// Returns true if attached.
async function uploadResumeFile(fileFields, resumePath) {
  if (!resumePath) {
    console.warn('[autofill] resume not attached: no saved resume file on disk');
    return false;
  }
  if (!fileFields || !fileFields.length) {
    console.warn('[autofill] resume not attached: no <input type="file"> found on the page');
    return false;
  }

  // Rank candidates: explicit resume/cv label wins; then accept= contains pdf/doc; then label hints.
  const score = (f) => {
    const lbl = (f.label || '').toLowerCase();
    const acc = (f.accept || '').toLowerCase();
    let s = 0;
    if (/resume|cv|curriculum vitae|biodata/.test(lbl)) s += 100;
    if (/cover\s*letter|portfolio|transcript|photo|picture|avatar/.test(lbl)) s -= 50;
    if (/\.pdf|application\/pdf/.test(acc)) s += 10;
    if (/\.docx?|msword|wordprocessingml/.test(acc)) s += 5;
    return s;
  };
  const ranked = [...fileFields].sort((a, b) => score(b) - score(a));

  for (const pick of ranked) {
    try {
      const frame = pick.frame;
      if (!frame) continue;
      const handle = await frame.$(pick.selector);
      if (!handle) continue;
      await handle.uploadFile(resumePath);
      // Notify React/ATS that the file has been attached.
      await frame.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) {
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, pick.selector);
      console.log(`[autofill] resume attached -> ${pick.selector} (label="${pick.label}")`);
      return true;
    } catch (e) {
      console.warn(`[autofill] resume attach failed for ${pick.selector}: ${e.message}`);
    }
  }
  return false;
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
    const resumeUploaded = await uploadResumeFile(fileFields, getResumePath(profile));

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
