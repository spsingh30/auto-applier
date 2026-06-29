// Raw resume text -> structured profile JSON.
// Pehle LLM try karta hai (accurate). API key na ho to heuristic fallback.
// LLM call OpenRouter (OpenAI-compatible /chat/completions) ke through jaata hai.
const { z } = require('zod');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// --- Output ka strict shape. LLM jo de, usko isse validate karte hain. ---
const ProfileSchema = z.object({
  fullName: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  linkedin: z.string().nullable().default(null),
  website: z.string().nullable().default(null),
  summary: z.string().nullable().default(null),
  skills: z.array(z.string()).default([]),
  experiences: z
    .array(
      z.object({
        company: z.string().nullable().default(null),
        title: z.string().nullable().default(null),
        startDate: z.string().nullable().default(null),
        endDate: z.string().nullable().default(null),
        description: z.string().nullable().default(null),
      })
    )
    .default([]),
  educations: z
    .array(
      z.object({
        school: z.string().nullable().default(null),
        degree: z.string().nullable().default(null),
        field: z.string().nullable().default(null),
        startDate: z.string().nullable().default(null),
        endDate: z.string().nullable().default(null),
      })
    )
    .default([]),
});

const SYSTEM_PROMPT = `You are a precise resume parser. Extract the candidate's information from the resume text and return ONLY a JSON object — no prose, no markdown fences.

Use exactly this shape:
{
  "fullName": string|null,
  "email": string|null,
  "phone": string|null,
  "location": string|null,
  "linkedin": string|null,
  "website": string|null,
  "summary": string|null,
  "skills": string[],
  "experiences": [{ "company": string|null, "title": string|null, "startDate": string|null, "endDate": string|null, "description": string|null }],
  "educations": [{ "school": string|null, "degree": string|null, "field": string|null, "startDate": string|null, "endDate": string|null }]
}

Rules:
- If a field is missing, use null (or [] for arrays). Do not invent data.
- Keep dates as written in the resume (e.g. "Jan 2021", "2019").
- "summary" = the candidate's profile/objective summary if present, else null.
- Return raw JSON only.`;

/**
 * @param {string} rawText
 * @returns {Promise<{ data: object, method: 'llm'|'heuristic' }>}
 */
async function parseResume(rawText) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    try {
      const data = await parseWithLLM(rawText, apiKey);
      return { data, method: 'llm' };
    } catch (err) {
      console.error('[resumeParser] LLM parse fail, heuristic pe gir rahe hain:', err.message);
    }
  }

  return { data: heuristicParse(rawText), method: 'heuristic' };
}

async function parseWithLLM(rawText, apiKey) {
  const model = process.env.LLM_MODEL || 'anthropic/claude-3.5-haiku';

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      // JSON-only output ko nudge karne ke liye.
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Resume text:\n\n${rawText.slice(0, 15000)}` },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${detail.slice(0, 300)}`);
  }

  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content || '';
  const json = extractJson(text);
  return ProfileSchema.parse(json); // Zod validate — galat shape pe yahin error.
}

// LLM kabhi-kabhi ```json fence laga deta hai — usko nikaalo.
function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('LLM output me JSON nahi mila');
  return JSON.parse(cleaned.slice(start, end + 1));
}

// --- Fallback: bina LLM ke basic regex extraction. ---
// Perfect nahi, par API key na ho tab bhi kuch to dikhe.
function heuristicParse(text) {
  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || null;
  const phone =
    text.match(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/)?.[0] || null;
  const linkedin = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[^\s)]+/i)?.[0] || null;

  // Pehli non-empty line ko naam maan lete hain (resume me aksar top pe naam hota hai).
  const firstLine =
    text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0 && l.length < 50 && !l.includes('@')) || null;

  // Common skills keyword scan.
  const SKILL_WORDS = [
    'JavaScript', 'TypeScript', 'React', 'Node', 'Node.js', 'Python', 'Java', 'C++',
    'SQL', 'MongoDB', 'PostgreSQL', 'Prisma', 'Express', 'Docker', 'AWS', 'Git',
    'HTML', 'CSS', 'Redux', 'GraphQL', 'Puppeteer',
  ];
  const lower = text.toLowerCase();
  const skills = SKILL_WORDS.filter((s) => lower.includes(s.toLowerCase()));

  return ProfileSchema.parse({
    fullName: firstLine,
    email,
    phone,
    linkedin,
    skills,
    summary: null,
    experiences: [],
    educations: [],
  });
}

module.exports = { parseResume, ProfileSchema };
