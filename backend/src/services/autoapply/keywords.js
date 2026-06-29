// Resume profile -> job-search keywords suggest karta hai.
// Pehle LLM (OpenRouter, sasta free model) try karta hai; na ho/fail ho to
// skills + experience titles se heuristic keywords banata hai.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You suggest job-search keywords for a candidate based on their resume.
Return ONLY a JSON object: { "keywords": string[] }.
Rules:
- Give 8-12 short, searchable job-title / role keywords (e.g. "Frontend Developer", "React Developer", "Backend Engineer", "Data Analyst").
- Base them on the candidate's skills and past roles. Prefer role/title style over bare skills.
- No duplicates, no sentences, no markdown. JSON only.`;

/**
 * @param {object} profile  - profileModel.getLatest() ka output (skills array, experiences[])
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
      console.error('[keywords] LLM fail, heuristic pe gir rahe hain:', err.message);
    }
  }

  return dedupe(heuristicKeywords(profile));
}

async function llmKeywords(profile, apiKey) {
  const model = process.env.LLM_MODEL || 'google/gemini-2.0-flash-exp:free';
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
  if (!Array.isArray(arr)) throw new Error('keywords array nahi mila');
  return arr.filter((k) => typeof k === 'string' && k.trim()).map((k) => k.trim());
}

// LLM kabhi ```json fence laga deta hai — saaf karke parse karo.
function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.search(/[[{]/);
  if (start === -1) throw new Error('JSON nahi mila');
  return JSON.parse(cleaned.slice(start));
}

// --- Fallback: bina LLM ke. Past roles + skills se keywords. ---
function heuristicKeywords(profile) {
  const titles = (profile.experiences || []).map((e) => e.title).filter(Boolean);
  const skills = (profile.skills || []).filter(Boolean);

  const out = [...titles];
  // Top skills ko "<Skill> Developer" role keyword bana do (web/dev skills ke liye useful).
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
