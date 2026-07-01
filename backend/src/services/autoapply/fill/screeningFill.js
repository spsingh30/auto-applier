// Generic AI form-filler — after the adapters' standard fields, whatever controls
// remain (text, textarea, select, radio, checkbox) are scraped with their label + options
// and filled by the AI. This is the core of "fill fully".
//
// Approach:
//  1) scrape all form controls + their labels + options from the page (data-aa-key tag)
//  2) skip already-filled / standard fields (name/email/phone/resume)
//  3) get an answer for each question from the AI (for options, the answer = exact option string)
//  4) apply by type: text→type, select→option, radio→click, checkbox→check
const { answerQuestions } = require('./screening');
const { matchPreference } = require('../preferences');
const { splitName } = require('./formUtils');

// Runs in the browser context — collect all controls + labels + options.
// (The function is passed into page.evaluate as a string.)
function scrapeFields() {
  // Skip only: email/phone/resume/cover-letter (the adapter fills these; if empty, the value-check
  // will allow them back in). Link/url fields are NOT skipped anymore — we fill them from the profile URL (below).
  const SKIP = /e-?mail|phone|resume|cover letter/i;
  // Is this a link field? If so, which kind (to fill from the profile). Otherwise null.
  function linkKind(label) {
    const l = label.toLowerCase();
    if (/linkedin/.test(l)) return 'linkedin';
    if (/github/.test(l)) return 'github';
    if (/twitter|^x\b|x\.com/.test(l)) return 'twitter';
    if (/portfolio|personal (web)?site|^website|other website|other link|^links?$|\burl\b/.test(l)) return 'website';
    return null;
  }
  // Is this a name field? (AI guessing gets it wrong — fill directly from the profile name). Otherwise null.
  function nameKind(label) {
    const l = label.toLowerCase();
    if (/legal last name|preferred last name|^last name|family name|surname/.test(l)) return 'last';
    if (/legal first name|preferred first name|preferred name|^first name|given name/.test(l)) return 'first';
    if (/^full legal name|^legal name|^full name|^name$|what.*your full name/.test(l)) return 'full';
    return null;
  }

  // Find the best label for an element.
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
    // 4) first label/legend/heading in the wrapper
    const wrap = el.closest('.field, .application-question, fieldset, [class*="question"], div');
    if (wrap) {
      const l = wrap.querySelector('label, legend, .application-label, h3, h4');
      if (l && l.textContent.trim()) return l.textContent;
    }
    // 5) label often ELEMENT/SIBLING ABOVE the field (no shared wrapper).
    //    Look for label/heading text in the previousElementSibling of the field and its ancestors.
    let node = el;
    for (let depth = 0; depth < 4 && node; depth++) {
      let prev = node.previousElementSibling;
      let hops = 0;
      while (prev && hops < 3) {
        // a sibling containing input/select/textarea isn't a label — skip it.
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
  // react-select / autocomplete dropdown? (a text input that's actually a dropdown)
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

    const isTextish = type !== 'select-one' && type !== 'select' && type !== 'radio' && type !== 'checkbox';

    // Link/URL field — fill from the profile (so the AI doesn't invent a URL). Text input only.
    const lk = linkKind(label);
    if (lk && isTextish) {
      if (el.value && el.value.trim()) continue;
      const k = `aa${key++}`;
      el.setAttribute('data-aa-key', k);
      out.push({ key: k, label, type: 'link', linkKind: lk, sel: `[data-aa-key="${k}"]` });
      continue;
    }

    // Name field — fill directly from the profile name (AI guessing is wrong, e.g. "LinkedIn").
    const nk = nameKind(label);
    if (nk && isTextish) {
      if (el.value && el.value.trim()) continue;
      const k = `aa${key++}`;
      el.setAttribute('data-aa-key', k);
      out.push({ key: k, label, type: 'name', nameKind: nk, sel: `[data-aa-key="${k}"]` });
      continue;
    }

    if (type === 'radio' || type === 'checkbox') {
      // Group by name — one question, multiple options.
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
      // If a single checkbox (consent style) — options just holds that one label.
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
      // Dropdown-as-text-input (react-select etc.) — commits via type + Enter.
      if (el.value && el.value.trim()) continue;
      const k = `aa${key++}`;
      el.setAttribute('data-aa-key', k);
      out.push({ key: k, label, type: 'combobox', sel: `[data-aa-key="${k}"]` });
    } else {
      // text, textarea, email-ish customs, etc.
      if (el.value && el.value.trim()) continue; // already filled — skip
      const k = `aa${key++}`;
      el.setAttribute('data-aa-key', k);
      out.push({ key: k, label, type: type === 'textarea' ? 'textarea' : 'text', sel: `[data-aa-key="${k}"]` });
    }
  }

  // Dedup: if for the same question (label) both a chooser (select/combobox/radio/checkbox)
  // AND a text field were created (react-select's inner extra input causes a duplicate),
  // drop the text one — the chooser is the correct one.
  const chooserLabels = new Set(
    out.filter((f) => !['text', 'textarea'].includes(f.type)).map((f) => f.label.toLowerCase())
  );
  return out.filter((f) => !(['text', 'textarea'].includes(f.type) && chooserLabels.has(f.label.toLowerCase())));
}

/**
 * The adapter should call this after filling the standard fields.
 * @returns {Promise<Array<{question,answer,type,applied}>>}
 */
async function fillRemaining(page, profile, job, notes, prefs = {}) {
  let fields = [];
  try {
    fields = await page.evaluate(`(${scrapeFields.toString()})()`);
  } catch (e) {
    notes.push(`screening scrape failed: ${e.message}`);
    return [];
  }
  if (!fields.length) {
    notes.push('screening: no extra fields found');
    return [];
  }

  // Link/URL fields come from the profile (not the AI). No twitter field → undefined.
  const LINK_VALUES = {
    linkedin: profile?.linkedin || null,
    github: profile?.github || null,
    website: profile?.website || null,
    twitter: profile?.twitter || null,
  };

  // Profile name -> first/last/full (to fill name fields deterministically).
  const nm = splitName(profile?.fullName);
  const NAME_VALUES = {
    first: nm.first || profile?.fullName || '',
    last: nm.last || '',
    full: profile?.fullName || [nm.first, nm.last].filter(Boolean).join(' '),
  };

  // 1) Name + saved-answers (preferences) first — no AI guess (accurate + fast).
  const ansByKey = {};
  const aiFields = [];
  for (const f of fields) {
    if (f.type === 'link' || f.type === 'name') continue;
    const pref = matchPreference(f.label, prefs);
    if (pref) ansByKey[f.key] = pref; // user provided it → use directly
    else aiFields.push(f); // otherwise ask the AI
  }

  // 2) Read options only for UNmatched comboboxes (the ones the AI needs) — for speed.
  for (const f of aiFields) {
    if (f.type === 'combobox') {
      f.options = await readComboOptions(page, f.sel); // string[]
    }
  }

  // 3) Remaining questions via the AI (if any).
  if (aiFields.length) {
    const qForAI = aiFields.map((f) => ({ label: f.label, options: optTexts(f) }));
    const answers = await answerQuestions(qForAI, profile, job);
    aiFields.forEach((f, i) => { ansByKey[f.key] = (answers[i] || '').trim(); });
  }

  const result = [];
  for (const f of fields) {
    let applied = false;
    let ans = '';
    try {
      if (f.type === 'link') {
        ans = LINK_VALUES[f.linkKind] || '';
        if (ans) applied = await applyText(page, f.sel, ans); // fill if there's data, otherwise leave blank
      } else if (f.type === 'name') {
        ans = NAME_VALUES[f.nameKind] || '';
        if (ans) applied = await applyText(page, f.sel, ans);
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
      notes.push(`"${f.label.slice(0, 30)}": apply failed (${e.message})`);
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

  // If typing brings up an autocomplete/suggestion list → this is actually a "choose option"
  // field (not just text). Click the matching option (otherwise raw text is left behind).
  await new Promise((r) => setTimeout(r, 260));
  const opts = await readRenderedOptions(page);
  if (opts.length) {
    const choice = chooseOption(opts, value);
    if (choice) {
      const ok = await clickOptionByText(page, choice);
      if (!ok) {
        // If clicking doesn't work, use the keyboard: highlight + select.
        await page.keyboard.press('ArrowDown').catch(() => {});
        await page.keyboard.press('Enter').catch(() => {});
      }
    }
  }
  return true;
}

// --- Option helpers (every dropdown/radio must have one option selected) ---

// Normalize field.options to string[] (select=string[], radio/checkbox={text}).
function optTexts(f) {
  if (!f.options || !f.options.length) return undefined;
  return f.options.map((o) => (typeof o === 'string' ? o : o.text)).filter(Boolean);
}

// Choose the best option for the wanted answer. If no match, pick neutral/first —
// so every field gets filled (the user wants "nothing left blank"). null only when there are no options.
function chooseOption(options, wanted) {
  if (!options || !options.length) return null;
  const w = String(wanted || '').toLowerCase().trim();
  const inc = options.filter((t) => w && t.toLowerCase().includes(w)).sort((a, b) => a.length - b.length);
  return (
    options.find((t) => t.toLowerCase() === w) ||
    options.find((t) => w.length > 1 && t.toLowerCase().startsWith(w)) ||
    inc[0] ||
    options.find((t) => w && w.includes(t.toLowerCase()) && t.length > 1) ||
    // No match — prefer a neutral/"none of the above" type option (better than wrong data).
    options.find((t) =>
      /prefer not|decline|don'?t wish|do not wish|not specified|not applicable|outside|international|do(es)? not (reside|apply)|none of|other|^n\/?a$/i.test(t)
    ) ||
    options[0] // last resort: choose something (so a required field isn't left blank)
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

// Open the menu, read the options, then close it (to hand off to the AI).
async function readComboOptions(page, sel) {
  const el = await page.$(sel);
  if (!el) return [];
  try {
    await el.evaluate((e) => e.scrollIntoView({ block: 'center' })).catch(() => {});
    await el.click().catch(() => {});
    await new Promise((r) => setTimeout(r, 300));
    const opts = await readRenderedOptions(page);
    await page.keyboard.press('Escape').catch(() => {});
    await new Promise((r) => setTimeout(r, 70));
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
  await new Promise((r) => setTimeout(r, 150));
}

// Combobox: open menu → (filter by typing if needed) → CLICK the best option. Always choose something.
// A required field is never left blank — even with no match, select the neutral/best option.
async function applyCombobox(page, sel, value) {
  const el = await page.$(sel);
  if (!el) return false;
  try {
    await el.evaluate((e) => e.scrollIntoView({ block: 'center' })).catch(() => {});
    await el.click().catch(() => {});
    await el.focus().catch(() => {});
    await new Promise((r) => setTimeout(r, 300));

    let opts = await readRenderedOptions(page);
    // Filter a long list by typing — BUT if the filter empties the list,
    // clear the input to bring the full list back (otherwise nothing renders → click fails → blank).
    if (opts.length > 8 && value) {
      await el.type(String(value), { delay: 18 });
      await new Promise((r) => setTimeout(r, 260));
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

    // Click failed (option not rendered yet — filter still applied?) → clear and retry from the full list.
    if (!ok) {
      await clearComboInput(page, el);
      const full = await readRenderedOptions(page);
      choice = chooseOption(full, value);
      if (choice) ok = await clickOptionByText(page, choice);
    }

    if (!ok) await page.keyboard.press('Escape').catch(() => {});
    await new Promise((r) => setTimeout(r, 70));
    return ok;
  } catch {
    return false;
  }
}

// Native <select>: choose the best option (always something).
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

// Radio/checkbox: click the best option. Single checkbox is a special case (consent vs required-agreement).
async function applyChoice(page, field, answer) {
  if (field.type === 'checkbox' && field.options.length === 1) {
    const label = (field.label || '').toLowerCase();
    // Optional marketing/contact-consent — never auto-tick (let the user do it).
    const isMarketing = /consent|contact me|subscribe|newsletter|updates|future (job )?opportunit|marketing|promotional|mailing list/i.test(label);
    // Required agreement (terms/privacy) — usually needed to submit, so tick it.
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
