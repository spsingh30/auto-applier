// Form fields + candidate profile -> the AI decides which value goes into which field.
// Output: [{ selector, value }]. Fields that shouldn't be filled (or are unknown) are skipped.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You fill job application forms. You are given:
1. A list of form fields (selector, label, type, "required" flag, options for selects).
2. A candidate profile.

Return ONLY JSON: { "fills": [ { "selector": string, "value": string } ] }.

=== TWO CLASSES OF FIELDS — TREAT THEM DIFFERENTLY ===

A) REQUIRED fields ("required": true — the compulsory red-star * ones).
   THIS IS THE #1 PRIORITY. You MUST fill EVERY required field you can.
   - Use the profile data when it answers the field (name, email, phone, location, links).
   - When the profile does NOT directly answer a required field, USE YOUR JUDGMENT to
     pick a sensible, honest value so the field is not left empty:
       • required "select"  -> ALWAYS choose the most appropriate option from the list.
       • required checkbox/radio (consent, "I agree", "I certify", privacy) -> "true".
       • required short question (country, work authorization, years of experience,
         "how did you hear about us", notice period) -> a short, reasonable, honest answer.
   - Only skip a required field if it is truly impossible (e.g. needs a file upload, or an
     OTP/verification code). Never leave a required field empty just because it is not
     explicitly in the profile.

B) OPTIONAL fields ("required": false / flag absent).
   Be CONSERVATIVE. Fill an optional field ONLY when its value is DIRECTLY available in the
   candidate's PERSONAL INFORMATION from the profile
   (full name, email, phone, location/city, LinkedIn, website/portfolio).
   - If that personal info is present in the profile -> fill it.
   - If it is NOT present in the profile -> LEAVE THE OPTIONAL FIELD EMPTY (omit it).
     Do NOT invent or guess optional personal details that aren't given.
   - Optional select / checkbox / free-text that is NOT personal info -> the AI may still
     fill it ONLY if it can make a clearly correct, honest choice from the profile;
     otherwise omit it. When unsure on an OPTIONAL field, omit.

=== SELECTS, CHECKBOXES, RADIOS, OPTIONS — think before choosing ===
- For "select" fields, value MUST be EXACTLY one of the given options (copy it verbatim).
- Read the label AND the options, then pick the option that best matches the candidate
  (e.g. location/country, work authorization, gender if optional & known, experience level).
- For checkboxes/radios use "true" to check (consent/acknowledge/agree). For optional
  marketing/newsletter opt-ins, omit unless clearly beneficial.

=== GENERAL ===
- Keep every value SHORT (a name, email, link, city, a word, one option) — not paragraphs.
- For long essay questions: required -> under 150 chars, honest & generic; optional -> omit.
- Never invent emails or phone numbers that are not in the profile.
- Keep selectors EXACTLY as given. Output JSON only, no markdown.`;

/**
 * @param {Array} fields  field descriptors from scrapeForm
 * @param {object} profile  profile from profileModel (with skills array)
 * @returns {Promise<Array<{selector:string, value:string}>>}
 */
async function aiDecideFills(fields, profile) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set — it is required for AI fill.');
  if (!fields.length) return [];

  // The AI sometimes returns empty/malformed output — retry up to 3 times until we get fills.
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const fills = await callOnce(fields, profile, apiKey);
      if (fills.length) return fills;
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  return [];
}

async function callOnce(fields, profile, apiKey) {
  // Fill runs on every job — a cheap but capable model. Override via the FILL_MODEL env var.
  const model = process.env.FILL_MODEL || 'google/gemini-2.0-flash-001';

  // Current company/title live in experiences — also pass them separately to the AI
  // (otherwise fields like "Current company" are left empty).
  const exps = profile.experiences || [];
  const current = exps[0] || {};

  const profileContext = {
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    location: profile.location,
    linkedin: profile.linkedin,
    website: profile.website,
    summary: profile.summary,
    skills: profile.skills,
    currentCompany: current.company || null,
    currentTitle: current.title || null,
    experiences: exps.map((e) => ({ company: e.company, title: e.title, startDate: e.startDate, endDate: e.endDate })),
  };

  const userMsg = `FORM FIELDS:\n${JSON.stringify(fields, null, 2)}\n\nCANDIDATE PROFILE:\n${JSON.stringify(profileContext, null, 2)}`;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 200)}`);
  }

  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content || '';
  const fills = parseFills(text);
  if (!Array.isArray(fills)) return [];

  // Keep only valid selectors (the ones present in the scrape).
  const valid = new Set(fields.map((f) => f.selector));
  return fills
    .filter((f) => f && typeof f.selector === 'string' && valid.has(f.selector) && f.value != null)
    .map((f) => ({ selector: f.selector, value: String(f.value) }));
}

// Robust: first try to parse the whole JSON; on truncation/error, salvage individual
// { "selector": ..., "value": ... } objects via regex.
function parseFills(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    const start = cleaned.search(/[[{]/);
    const json = JSON.parse(cleaned.slice(start));
    return Array.isArray(json) ? json : json.fills;
  } catch {
    const out = [];
    const re = /\{\s*"selector"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"value"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
    let m;
    while ((m = re.exec(cleaned))) {
      try {
        out.push({ selector: JSON.parse(`"${m[1]}"`), value: JSON.parse(`"${m[2]}"`) });
      } catch { /* skip bad */ }
    }
    return out;
  }
}

module.exports = { aiDecideFills };
