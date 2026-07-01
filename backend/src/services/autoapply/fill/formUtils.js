// Small, defensive form helpers for adapters.
// ATS selectors change over time — every action is in try/catch; on failure, skip + note.
// We never throw; we return { ok, note } so one failing field doesn't
// stop the whole apply (in review mode the user can fill the rest).

// Return the handle of the first selector found on the page (otherwise null).
async function firstMatch(page, selectors) {
  for (const sel of selectors) {
    const el = await page.$(sel).catch(() => null);
    if (el) return { el, sel };
  }
  return null;
}

// Type a value into an input/textarea. Skip if value is falsy.
async function typeInto(page, selectors, value, label) {
  const name = label || (Array.isArray(selectors) ? selectors[0] : selectors);
  if (value == null || value === '') return { ok: false, note: `${name}: no value, skip` };
  const m = await firstMatch(page, [].concat(selectors));
  if (!m) return { ok: false, note: `${name}: field not found` };
  // We don't handle checkbox/radio here (text fields only) — avoid typing into the wrong type.
  const type = await m.el.evaluate((el) => el.type || el.tagName.toLowerCase()).catch(() => '');
  if (type === 'checkbox' || type === 'radio' || type === 'file') {
    return { ok: false, note: `${name}: ${type} field, skipping text fill` };
  }
  try {
    await m.el.focus().catch(() => {});
    // Select-all + delete — so any pre-filled value is fully cleared (otherwise it concatenates).
    await m.el.click({ clickCount: 3 }).catch(() => {});
    await page.keyboard.down('Control').catch(() => {});
    await page.keyboard.press('KeyA').catch(() => {});
    await page.keyboard.up('Control').catch(() => {});
    await page.keyboard.press('Delete').catch(() => {});
    await m.el.type(String(value), { delay: 12 });
    return { ok: true, note: `${name}: filled` };
  } catch (e) {
    return { ok: false, note: `${name}: type failed (${e.message})` };
  }
}

// Attach the resume to a file input.
async function attachFile(page, selectors, filePath, label = 'resume') {
  if (!filePath) return { ok: false, note: `${label}: no file path (re-upload the resume)` };
  const m = await firstMatch(page, [].concat(selectors));
  if (!m) return { ok: false, note: `${label}: file input not found` };
  try {
    await m.el.uploadFile(filePath);
    return { ok: true, note: `${label}: attached` };
  } catch (e) {
    return { ok: false, note: `${label}: attach failed (${e.message})` };
  }
}

// Choose the best match by label/value in a <select>.
async function selectOption(page, selectors, wanted, label) {
  const m = await firstMatch(page, [].concat(selectors));
  if (!m) return { ok: false, note: `${label}: select not found` };
  try {
    const options = await m.el.$$eval('option', (os) =>
      os.map((o) => ({ value: o.value, text: o.textContent.trim() }))
    );
    const want = String(wanted || '').toLowerCase();
    const hit =
      options.find((o) => o.text.toLowerCase() === want) ||
      options.find((o) => o.text.toLowerCase().includes(want) && want) ||
      null;
    if (!hit) return { ok: false, note: `${label}: no matching option found` };
    await m.el.select(hit.value);
    return { ok: true, note: `${label}: chose "${hit.text}"` };
  } catch (e) {
    return { ok: false, note: `${label}: select failed (${e.message})` };
  }
}

// Dismiss cookie/consent banners best-effort (so the form is visible).
async function dismissBanners(page) {
  const texts = ['accept', 'agree', 'got it', 'allow all', 'i accept'];
  try {
    await page.evaluate((labels) => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      for (const b of btns) {
        const t = (b.textContent || '').trim().toLowerCase();
        if (labels.some((l) => t === l || t.includes(l))) {
          b.click();
          break;
        }
      }
    }, texts);
  } catch {
    /* ignore */
  }
}

// Split the profile's fullName into first/last.
function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

module.exports = { firstMatch, typeInto, attachFile, selectOption, dismissBanners, splitName };
