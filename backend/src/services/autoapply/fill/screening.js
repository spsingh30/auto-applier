// Drafts answers to screening questions via the LLM (OpenRouter).
// The adapter scrapes questions (label + type) from the form → sends them here →
// we generate answers using profile + job context. Review mode: the user reviews and submits.
// If the API key is missing/fails → heuristic fallback (short generic answers).
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You fill a job application form on behalf of a candidate. Answer EVERY question — never leave one blank.
Return ONLY a JSON object: { "answers": string[] } — same length and order as the questions given.

How to answer:
- Prefer facts from the candidate profile (skills, roles, company, location, education). Don't fabricate specific employers, dates, or credentials that aren't there.
- When a question lists [options: a | b | c], your answer MUST be EXACTLY one of those option strings, copied verbatim. Choose the single best fit.
- When the profile doesn't directly say, choose the answer a typical strong applicant would give for THIS job (use the job title/location/company context). Always commit to a concrete choice.

Common-sense defaults when info is missing:
- Work authorization for the job's country: "Yes" (authorized) unless the profile clearly implies otherwise.
- Visa sponsorship needed: pick "No" if the candidate's location matches the job's country, else "Yes".
- "How did you hear about us / source": prefer an option like LinkedIn, then Job board/Indeed, then Company website, then Other.
- Notice period / availability / start date: "Immediately" (or the soonest option).
- Expected salary / compensation: "Negotiable" (or "As per company standards").
- Years of experience: estimate from the profile's roles.
- Gender / race / ethnicity / veteran / disability and other demographic/EEO questions: choose an option like "Prefer not to say" / "Decline to self-identify" / "I don't wish to answer" if present, otherwise the most neutral option.
- Relocation / remote willingness: "Yes".
- "When are you available to start / for full-time work / fellowship?": "Immediately" (or "Available immediately").
- "What role(s) / job(s) are you applying for?": the exact job title from the job context.
- "Current / most recent company / employer": the company of the most recent role in the profile.
- "Legal / preferred FIRST name": the candidate's first name only (e.g. first word of the full name). "Legal / preferred LAST name": the last name only. "Full name / legal name": the complete name.
- Conditional "If other, please specify / provide further details": if nothing applies, answer "N/A".
- Location/region dropdowns (US state, province, country) where the candidate's actual location is NOT among the options: pick the closest "none/other" style option that IS listed — e.g. "Other", "Outside the US", "I do not reside in the US/Canada", "International", "Not applicable". If no such option exists, pick the most neutral listed option. Never answer with text that isn't an option.
- Conditional free-text like "If you are not based in <cities>, please explain…": answer truthfully — state the candidate's actual city/country and that they are open to remote work / relocation.

Free-text questions: 1-3 honest sentences in first person, or a single word/number when that's what's asked.
No markdown, no preamble. JSON only.`;

/**
 * @param {Array<{label:string, type?:string, options?:string[]}>} questions
 * @param {object} profile  - profileModel.getLatest() output
 * @param {object} job      - { company, jobTitle, location }
 * @returns {Promise<string[]>} answers (same order); fail-safe never throws
 */
async function answerQuestions(questions, profile, job) {
  if (!Array.isArray(questions) || !questions.length) return [];

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    try {
      const a = await llmAnswers(questions, profile, job, apiKey);
      if (a.length === questions.length) return a;
      // length mismatch → pad/truncate to be safe
      return questions.map((_, i) => a[i] || heuristicAnswer(questions[i], profile));
    } catch (err) {
      console.error('[screening] LLM failed, falling back to heuristic:', err.message);
    }
  }

  return questions.map((q) => heuristicAnswer(q, profile));
}

async function llmAnswers(questions, profile, job, apiKey) {
  const model = process.env.LLM_MODEL || 'google/gemini-2.0-flash-exp:free';

  const profileCtx = [
    `Name: ${profile?.fullName || '(unknown)'}`,
    `Location: ${profile?.location || '(unknown)'}`,
    `Skills: ${(profile?.skills || []).join(', ') || '(none)'}`,
    `Experience: ${(profile?.experiences || [])
      .map((e) => `${e.title || ''} @ ${e.company || ''}`.trim())
      .filter(Boolean)
      .join('; ') || '(none)'}`,
    `Summary: ${profile?.summary || '(none)'}`,
  ].join('\n');

  const jobCtx = `Applying for: ${job?.jobTitle || ''} at ${job?.company || ''} (${job?.location || 'n/a'})`;

  const qList = questions
    .map((q, i) => `${i + 1}. ${q.label}${q.options?.length ? ` [options: ${q.options.join(' | ')}]` : ''}`)
    .join('\n');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `CANDIDATE PROFILE:\n${profileCtx}\n\n${jobCtx}\n\nQUESTIONS:\n${qList}` },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 200)}`);
  }

  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content || '';
  const json = extractJson(text);
  const arr = Array.isArray(json) ? json : json.answers;
  if (!Array.isArray(arr)) throw new Error('answers array not found');
  return arr.map((a) => (typeof a === 'string' ? a : String(a ?? '')));
}

function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new Error('JSON not found');
  return JSON.parse(cleaned.slice(start));
}

// --- Fallback (no LLM): best-effort short answer based on question type. ---
function heuristicAnswer(q, profile) {
  const label = (q.label || '').toLowerCase();
  if (/year|experience/.test(label)) {
    const n = (profile?.experiences || []).length;
    return n ? String(Math.max(1, n)) : 'Not specified';
  }
  if (/authoriz|eligible|visa|sponsor/.test(label)) return 'Prefer to discuss';
  if (/notice period|available|start/.test(label)) return 'Immediately available';
  if (/salary|compensation|ctc/.test(label)) return 'Open / negotiable';
  if (/why|interest|cover/.test(label)) {
    const role = (profile?.experiences?.[0]?.title) || 'this role';
    return `My background in ${role} aligns well with this position and I'm excited to contribute.`;
  }
  if (q.options?.length) return q.options[0]; // default to the first option
  return 'Not specified';
}

module.exports = { answerQuestions };
