// Adapters ke liye chhote, defensive form helpers.
// ATS selectors waqt ke saath badalte hain — har action try/catch me, fail ho to skip + note.
// Kabhi throw nahi karte; { ok, note } return karte hain taaki ek field fail hone par
// puri apply na ruke (review mode me user baaki bhar sakta hai).

// Pehla selector jo page pe mile uska handle do (warna null).
async function firstMatch(page, selectors) {
  for (const sel of selectors) {
    const el = await page.$(sel).catch(() => null);
    if (el) return { el, sel };
  }
  return null;
}

// Input/textarea me value type karo. value falsy ho to skip.
async function typeInto(page, selectors, value, label) {
  const name = label || (Array.isArray(selectors) ? selectors[0] : selectors);
  if (value == null || value === '') return { ok: false, note: `${name}: value nahi tha, skip` };
  const m = await firstMatch(page, [].concat(selectors));
  if (!m) return { ok: false, note: `${name}: field nahi mila` };
  // Checkbox/radio yahan handle nahi karte (text fields only) — galat type se bacho.
  const type = await m.el.evaluate((el) => el.type || el.tagName.toLowerCase()).catch(() => '');
  if (type === 'checkbox' || type === 'radio' || type === 'file') {
    return { ok: false, note: `${name}: ${type} field, text fill skip` };
  }
  try {
    await m.el.focus().catch(() => {});
    // Select-all + delete — pre-filled value poora clear ho (warna concat ho jaata hai).
    await m.el.click({ clickCount: 3 }).catch(() => {});
    await page.keyboard.down('Control').catch(() => {});
    await page.keyboard.press('KeyA').catch(() => {});
    await page.keyboard.up('Control').catch(() => {});
    await page.keyboard.press('Delete').catch(() => {});
    await m.el.type(String(value), { delay: 12 });
    return { ok: true, note: `${name}: bhara` };
  } catch (e) {
    return { ok: false, note: `${name}: type fail (${e.message})` };
  }
}

// File input pe resume attach karo.
async function attachFile(page, selectors, filePath, label = 'resume') {
  if (!filePath) return { ok: false, note: `${label}: file path nahi (resume re-upload karo)` };
  const m = await firstMatch(page, [].concat(selectors));
  if (!m) return { ok: false, note: `${label}: file input nahi mila` };
  try {
    await m.el.uploadFile(filePath);
    return { ok: true, note: `${label}: attach hui` };
  } catch (e) {
    return { ok: false, note: `${label}: attach fail (${e.message})` };
  }
}

// <select> me label/value se best match choose karo.
async function selectOption(page, selectors, wanted, label) {
  const m = await firstMatch(page, [].concat(selectors));
  if (!m) return { ok: false, note: `${label}: select nahi mila` };
  try {
    const options = await m.el.$$eval('option', (os) =>
      os.map((o) => ({ value: o.value, text: o.textContent.trim() }))
    );
    const want = String(wanted || '').toLowerCase();
    const hit =
      options.find((o) => o.text.toLowerCase() === want) ||
      options.find((o) => o.text.toLowerCase().includes(want) && want) ||
      null;
    if (!hit) return { ok: false, note: `${label}: matching option nahi mila` };
    await m.el.select(hit.value);
    return { ok: true, note: `${label}: "${hit.text}" chuna` };
  } catch (e) {
    return { ok: false, note: `${label}: select fail (${e.message})` };
  }
}

// Cookie/consent banners best-effort hata do (form dikhe).
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

// Profile ke fullName ko first/last me todo.
function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

module.exports = { firstMatch, typeInto, attachFile, selectOption, dismissBanners, splitName };
