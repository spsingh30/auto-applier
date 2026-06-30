// Generic AI form-filler — adapters ke standard fields ke baad jo bhi controls
// bache (text, textarea, select, radio, checkbox) unhe label + options ke saath scrape
// karke AI se bharta hai. Yehi "fill fully" ka core hai.
//
// Approach:
//  1) page se saare form controls + unke labels + options scrape (data-aa-key tag)
//  2) already-filled / standard (name/email/phone/resume) skip
//  3) AI se har question ka answer (options wale ka answer = exact option string)
//  4) type ke hisaab se apply: text→type, select→option, radio→click, checkbox→check
const { answerQuestions } = require('./screening');

// Browser context me chalega — saare controls + labels + options nikaalo.
// (Function ko string ke roop me page.evaluate me bhejte hain.)
function scrapeFields() {
  // Skip sirf: email/phone/resume/cover-letter (adapter bharta hai; khaali ho to value-check
  // wapas allow karega). Link/url fields ab SKIP nahi — unhe profile URL se bharte hain (neeche).
  const SKIP = /e-?mail|phone|resume|cover letter/i;
  // Link field hai? to kaunsa (profile se bharne ke liye). warna null.
  function linkKind(label) {
    const l = label.toLowerCase();
    if (/linkedin/.test(l)) return 'linkedin';
    if (/github/.test(l)) return 'github';
    if (/twitter|^x\b|x\.com/.test(l)) return 'twitter';
    if (/portfolio|personal (web)?site|^website|other website|other link|^links?$|\burl\b/.test(l)) return 'website';
    return null;
  }

  // Kisi element ka best label dhoondo.
  function labelFor(el) {
    // 1) <label for=id>
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l && l.textContent.trim()) return l.textContent;
    }
    // 2) aria-label / aria-labelledby
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    const lb = el.getAttribute('aria-labelledby');
    if (lb) {
      const t = lb.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
      if (t) return t;
    }
    // 3) closest <label> ancestor
    const anc = el.closest('label');
    if (anc && anc.textContent.trim()) return anc.textContent;
    // 4) wrapper me pehla label/legend/heading
    const wrap = el.closest('.field, .application-question, fieldset, [class*="question"], div');
    if (wrap) {
      const l = wrap.querySelector('label, legend, .application-label, h3, h4');
      if (l && l.textContent.trim()) return l.textContent;
    }
    // 5) label often ELEMENT/SIBLING ABOVE the field (no shared wrapper).
    //    Field aur uske ancestors ke previousElementSibling me label/heading text dekho.
    let node = el;
    for (let depth = 0; depth < 4 && node; depth++) {
      let prev = node.previousElementSibling;
      let hops = 0;
      while (prev && hops < 3) {
        // input/select/textarea wala sibling label nahi hota — chhodo.
        if (!prev.querySelector('input, select, textarea') && !/^(input|select|textarea)$/i.test(prev.tagName)) {
          const t = (prev.textContent || '').trim();
          if (t && t.length <= 250) return t;
        }
        prev = prev.previousElementSibling;
        hops++;
      }
      node = node.parentElement;
    }
    // 6) placeholder / title
    return el.getAttribute('placeholder') || el.getAttribute('title') || '';
  }

  function clean(s) {
    return (s || '').replace(/\*|✱|required/gi, '').replace(/\s+/g, ' ').trim();
  }
  // react-select / autocomplete dropdown? (text input jo asal me dropdown hai)
  function isCombobox(el) {
    if (el.getAttribute('role') === 'combobox') return true;
    if (el.getAttribute('aria-autocomplete')) return true;
    if (/react-select|select2|chosen|autocomplete/i.test(el.id || '')) return true;
    if (el.closest('.select__control, [class*="react-select"], .select2-container, .chosen-container')) return true;
    return false;
  }
  function visible(el) {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden' && (r.width > 0 || r.height > 0);
  }

  const out = [];
  let key = 0;
  const seenRadio = new Set();

  const controls = Array.from(document.querySelectorAll('input, textarea, select'));
  for (const el of controls) {
    const type = (el.type || el.tagName).toLowerCase();
    if (['hidden', 'submit', 'button', 'file', 'image', 'reset', 'search', 'url'].includes(type)) continue;
    if (el.disabled || el.readOnly || !visible(el)) continue;

    const label = clean(labelFor(el));
    if (!label || label.length > 250) continue;
    if (SKIP.test(label)) continue;

    // Link/URL field — profile se bharenge (AI URL invent na kare). Text input hi.
    const lk = linkKind(label);
    if (lk && type !== 'select-one' && type !== 'select' && type !== 'radio' && type !== 'checkbox') {
      if (el.value && el.value.trim()) continue;
      const k = `aa${key++}`;
      el.setAttribute('data-aa-key', k);
      out.push({ key: k, label, type: 'link', linkKind: lk, sel: `[data-aa-key="${k}"]` });
      continue;
    }

    if (type === 'radio' || type === 'checkbox') {
      // Group by name — ek hi question, multiple options.
      const groupKey = `${type}:${el.name || label}`;
      if (seenRadio.has(groupKey)) continue;
      seenRadio.add(groupKey);
      const peers = el.name
        ? Array.from(document.querySelectorAll(`input[type="${type}"][name="${CSS.escape(el.name)}"]`))
        : [el];
      const options = [];
      peers.forEach((p, i) => {
        const k = `aa${key}_${i}`;
        p.setAttribute('data-aa-key', k);
        options.push({ key: k, text: clean(labelFor(p)) || p.value || `option ${i + 1}` });
      });
      // Agar single checkbox (consent style) — options me bas wahi label.
      out.push({ key: `aa${key}`, label, type, options });
      key++;
    } else if (type === 'select-one' || type === 'select' || el.tagName.toLowerCase() === 'select') {
      const k = `aa${key++}`;
      el.setAttribute('data-aa-key', k);
      const options = Array.from(el.options)
        .map((o) => clean(o.textContent))
        .filter((t) => t && !/^(select|choose|please|--)/i.test(t));
      if (!options.length) continue;
      out.push({ key: k, label, type: 'select', options, sel: `[data-aa-key="${k}"]` });
    } else if (type !== 'textarea' && isCombobox(el)) {
      // Dropdown-as-text-input (react-select etc.) — type + Enter se commit hoga.
      if (el.value && el.value.trim()) continue;
      const k = `aa${key++}`;
      el.setAttribute('data-aa-key', k);
      out.push({ key: k, label, type: 'combobox', sel: `[data-aa-key="${k}"]` });
    } else {
      // text, textarea, email-ish customs, etc.
      if (el.value && el.value.trim()) continue; // pehle se bhara hai — chhodo
      const k = `aa${key++}`;
      el.setAttribute('data-aa-key', k);
      out.push({ key: k, label, type: type === 'textarea' ? 'textarea' : 'text', sel: `[data-aa-key="${k}"]` });
    }
  }

  // Dedup: ek hi question (label) ke liye agar chooser (select/combobox/radio/checkbox)
  // AUR text dono ban gaye (react-select ke andar ka extra input duplicate banata hai),
  // to text-wala hata do — chooser hi sahi hai.
  const chooserLabels = new Set(
    out.filter((f) => !['text', 'textarea'].includes(f.type)).map((f) => f.label.toLowerCase())
  );
  return out.filter((f) => !(['text', 'textarea'].includes(f.type) && chooserLabels.has(f.label.toLowerCase())));
}

/**
 * Adapter standard fields bharne ke baad ye call kare.
 * @returns {Promise<Array<{question,answer,type,applied}>>}
 */
async function fillRemaining(page, profile, job, notes) {
  let fields = [];
  try {
    fields = await page.evaluate(`(${scrapeFields.toString()})()`);
  } catch (e) {
    notes.push(`screening scrape fail: ${e.message}`);
    return [];
  }
  if (!fields.length) {
    notes.push('screening: koi extra field nahi mila');
    return [];
  }

  // Link/URL fields profile se aate hain (AI nahi). twitter ka field nahi → undefined.
  const LINK_VALUES = {
    linkedin: profile?.linkedin || null,
    github: profile?.github || null,
    website: profile?.website || null,
    twitter: profile?.twitter || null,
  };

  // AI sirf non-link fields ke liye. Combobox options pehle padho.
  const aiFields = fields.filter((f) => f.type !== 'link');
  for (const f of aiFields) {
    if (f.type === 'combobox') {
      f.options = await readComboOptions(page, f.sel); // string[]
    }
  }
  const qForAI = aiFields.map((f) => ({ label: f.label, options: optTexts(f) }));
  const answers = await answerQuestions(qForAI, profile, job);
  const ansByKey = {};
  aiFields.forEach((f, i) => { ansByKey[f.key] = (answers[i] || '').trim(); });

  const result = [];
  for (const f of fields) {
    let applied = false;
    let ans = '';
    try {
      if (f.type === 'link') {
        ans = LINK_VALUES[f.linkKind] || '';
        if (ans) applied = await applyText(page, f.sel, ans); // data ho to bharo, warna blank
      } else {
        ans = ansByKey[f.key] || '';
        if (f.type === 'text' || f.type === 'textarea') {
          applied = await applyText(page, f.sel, ans);
        } else if (f.type === 'combobox') {
          applied = await applyCombobox(page, f.sel, ans);
        } else if (f.type === 'select') {
          applied = await applySelect(page, f.sel, ans, f.options);
        } else if (f.type === 'radio' || f.type === 'checkbox') {
          applied = await applyChoice(page, f, ans);
        }
      }
    } catch (e) {
      notes.push(`"${f.label.slice(0, 30)}": apply fail (${e.message})`);
    }
    notes.push(`[${f.type}] ${f.label.slice(0, 38)} → ${applied ? `"${String(ans).slice(0, 34)}"` : 'skip'}`);
    result.push({ question: f.label, answer: ans, type: f.type, applied });
  }
  return result;
}

async function applyText(page, sel, value) {
  if (!value) return false;
  const el = await page.$(sel);
  if (!el) return false;
  await el.focus().catch(() => {});
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
  await el.type(value, { delay: 12 });

  // Type karne par agar autocomplete/suggestion list aayi → ye asal me "choose option"
  // field hai (sirf text nahi). Matching option click kar do (warna raw text reh jaata).
  await new Promise((r) => setTimeout(r, 450));
  const opts = await readRenderedOptions(page);
  if (opts.length) {
    const choice = chooseOption(opts, value);
    if (choice) {
      const ok = await clickOptionByText(page, choice);
      if (!ok) {
        // Click na chale to keyboard se: highlight + select.
        await page.keyboard.press('ArrowDown').catch(() => {});
        await page.keyboard.press('Enter').catch(() => {});
      }
    }
  }
  return true;
}

// --- Option helpers (har dropdown/radio me ek na ek option chun-na hai) ---

// field.options ko string[] me normalize karo (select=string[], radio/checkbox={text}).
function optTexts(f) {
  if (!f.options || !f.options.length) return undefined;
  return f.options.map((o) => (typeof o === 'string' ? o : o.text)).filter(Boolean);
}

// Wanted answer ke liye sabse acha option chuno. Match na mile to neutral/pehla —
// taaki har field bhare (user "koi blank na rahe" chahta hai). null sirf jab options hi na hon.
function chooseOption(options, wanted) {
  if (!options || !options.length) return null;
  const w = String(wanted || '').toLowerCase().trim();
  const inc = options.filter((t) => w && t.toLowerCase().includes(w)).sort((a, b) => a.length - b.length);
  return (
    options.find((t) => t.toLowerCase() === w) ||
    options.find((t) => w.length > 1 && t.toLowerCase().startsWith(w)) ||
    inc[0] ||
    options.find((t) => w && w.includes(t.toLowerCase()) && t.length > 1) ||
    // Koi match nahi — neutral/"none of the above" type option prefer karo (galat data se behtar).
    options.find((t) =>
      /prefer not|decline|don'?t wish|do not wish|not specified|not applicable|outside|international|do(es)? not (reside|apply)|none of|other|^n\/?a$/i.test(t)
    ) ||
    options[0] // last resort: kuch to chuno (required field blank na rahe)
  );
}

// Rendered dropdown/autocomplete options (react-select + generic typeahead lists).
const OPTION_SELECTOR =
  '[role="option"], .select__option, li[class*="option"], [class*="-option"], ' +
  '[role="listbox"] li, ul[class*="result"] li, ul[class*="suggest"] li, ' +
  '.dropdown-menu li, [class*="autocomplete"] li, [class*="typeahead"] li';

async function readRenderedOptions(page) {
  return page
    .evaluate((SEL) =>
      Array.from(document.querySelectorAll(SEL))
        .filter((o) => o.offsetParent !== null && o.textContent.trim())
        .map((o) => o.textContent.trim()),
      OPTION_SELECTOR
    )
    .catch(() => []);
}

// Menu khol ke options padho, phir band kar do (AI ko dene ke liye).
async function readComboOptions(page, sel) {
  const el = await page.$(sel);
  if (!el) return [];
  try {
    await el.evaluate((e) => e.scrollIntoView({ block: 'center' })).catch(() => {});
    await el.click().catch(() => {});
    await new Promise((r) => setTimeout(r, 350));
    const opts = await readRenderedOptions(page);
    await page.keyboard.press('Escape').catch(() => {});
    await new Promise((r) => setTimeout(r, 120));
    return opts;
  } catch {
    return [];
  }
}

async function clickOptionByText(page, text) {
  return page
    .evaluate(
      (m, SEL) => {
        const o = Array.from(document.querySelectorAll(SEL)).find(
          (x) => x.offsetParent !== null && x.textContent.trim() === m
        );
        if (!o) return false;
        o.click();
        return true;
      },
      text,
      OPTION_SELECTOR
    )
    .catch(() => false);
}

async function clearComboInput(page, el) {
  await el.focus().catch(() => {});
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Delete');
  await new Promise((r) => setTimeout(r, 250));
}

// Combobox: menu khol → (zaroorat ho to type se filter) → best option CLICK. Hamesha kuch chuno.
// Required field kabhi blank na rahe — match na mile to bhi neutral/best option select.
async function applyCombobox(page, sel, value) {
  const el = await page.$(sel);
  if (!el) return false;
  try {
    await el.evaluate((e) => e.scrollIntoView({ block: 'center' })).catch(() => {});
    await el.click().catch(() => {});
    await el.focus().catch(() => {});
    await new Promise((r) => setTimeout(r, 300));

    let opts = await readRenderedOptions(page);
    // Lambi list ko type se filter karo — PAR agar filter se list khaali ho jaaye to
    // input clear karke poori list wapas le aao (warna kuch render nahi → click fail → blank).
    if (opts.length > 8 && value) {
      await el.type(String(value), { delay: 18 });
      await new Promise((r) => setTimeout(r, 450));
      const filtered = await readRenderedOptions(page);
      if (filtered.length) {
        opts = filtered;
      } else {
        await clearComboInput(page, el);
        opts = await readRenderedOptions(page);
      }
    }

    let choice = chooseOption(opts, value);
    let ok = choice ? await clickOptionByText(page, choice) : false;

    // Click fail (option abhi rendered nahi — filter laga reh gaya?) → clear karke full list se dobara.
    if (!ok) {
      await clearComboInput(page, el);
      const full = await readRenderedOptions(page);
      choice = chooseOption(full, value);
      if (choice) ok = await clickOptionByText(page, choice);
    }

    if (!ok) await page.keyboard.press('Escape').catch(() => {});
    await new Promise((r) => setTimeout(r, 120));
    return ok;
  } catch {
    return false;
  }
}

// Native <select>: best option chuno (hamesha kuch).
async function applySelect(page, sel, answer, options) {
  const el = await page.$(sel);
  if (!el) return false;
  const hit = chooseOption(options, answer);
  if (!hit) return false;
  return page.evaluate(
    (s, text) => {
      const elm = document.querySelector(s);
      if (!elm) return false;
      const opt = Array.from(elm.options).find((o) => o.textContent.trim().toLowerCase() === text.toLowerCase());
      if (!opt) return false;
      elm.value = opt.value;
      elm.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    },
    sel,
    hit
  );
}

// Radio/checkbox: best option click. Single checkbox special-case (consent vs required-agreement).
async function applyChoice(page, field, answer) {
  if (field.type === 'checkbox' && field.options.length === 1) {
    const label = (field.label || '').toLowerCase();
    // Optional marketing/contact-consent — kabhi auto-tick mat karo (user khud kare).
    const isMarketing = /consent|contact me|subscribe|newsletter|updates|future (job )?opportunit|marketing|promotional|mailing list/i.test(label);
    // Required agreement (terms/privacy) — usually submit ke liye zaroori, tick kar do.
    const isAgreement = /agree|terms|privacy|acknowledge|certify|authorize|confirm|i have read|gdpr|consent to (the )?process/i.test(label);
    if (isMarketing && !isAgreement) return false;
    if (isAgreement || /\b(yes|haan|true|i have|i do)\b/i.test(answer)) {
      return clickByKey(page, field.options[0].key);
    }
    return false;
  }
  const texts = field.options.map((o) => o.text);
  const choice = chooseOption(texts, answer);
  if (!choice) return false;
  const hit = field.options.find((o) => o.text === choice);
  if (!hit) return false;
  return clickByKey(page, hit.key);
}

async function clickByKey(page, key) {
  return page.evaluate((k) => {
    const el = document.querySelector(`[data-aa-key="${k}"]`);
    if (!el) return false;
    el.click();
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return el.checked === true;
  }, key);
}

module.exports = { fillRemaining };
