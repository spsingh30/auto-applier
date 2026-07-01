// Suggests job-search keywords from a resume profile.
// First tries the LLM (OpenRouter, a cheap free model); if unavailable/failing,
// builds heuristic keywords from skills + experience titles.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You suggest job-search keywords for a candidate based on their resume.
Return ONLY a JSON object: { "keywords": string[] }.
Rules:
- Give 8-12 short, searchable job-title / role keywords (e.g. "Frontend Developer", "React Developer", "Backend Engineer", "Data Analyst").
- Base them on the candidate's skills and past roles. Prefer role/title style over bare skills.
- No duplicates, no sentences, no markdown. JSON only.`;

/**
 * @param {object} profile  - output of profileModel.getLatest() (skills array, experiences[])
 * @returns {Promise<string[]>}
 */
async function suggestKeywords(profile) {
  if (!profile) return [];

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    try {
      const llm = await llmKeywords(profile, apiKey);
      if (llm.length) return dedupe(llm);
    } catch (err) {
      console.error('[keywords] LLM failed, falling back to heuristic:', err.message);
    }
  }

  return dedupe(heuristicKeywords(profile));
}

async function llmKeywords(profile, apiKey) {
  const model = process.env.KEYWORDS_MODEL || 'google/gemini-2.0-flash-exp:free';
  const titles = (profile.experiences || []).map((e) => e.title).filter(Boolean);
  const context = [
    `Skills: ${(profile.skills || []).join(', ') || '(none)'}`,
    `Past roles: ${titles.join(', ') || '(none)'}`,
    `Summary: ${profile.summary || '(none)'}`,
  ].join('\n');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: context },
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
  const arr = Array.isArray(json) ? json : json.keywords;
  if (!Array.isArray(arr)) throw new Error('keywords array not found');
  return arr.filter((k) => typeof k === 'string' && k.trim()).map((k) => k.trim());
}

// The LLM sometimes adds a ```json fence — strip it and parse.
function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new Error('JSON not found');
  return JSON.parse(cleaned.slice(start));
}

// --- Fallback: without the LLM. Keywords from past roles + skills. ---
function heuristicKeywords(profile) {
  const titles = (profile.experiences || []).map((e) => e.title).filter(Boolean);
  const skills = (profile.skills || []).filter(Boolean);

  const out = [...titles];
  // Turn top skills into "<Skill> Developer" role keywords (useful for web/dev skills).
  for (const s of skills.slice(0, 6)) {
    out.push(s);
    out.push(`${s} Developer`);
  }
  return out;
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const k of list) {
    const key = k.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(k);
    }
  }
  return out.slice(0, 12);
}

module.exports = { suggestKeywords };
