// Raw resume text -> structured profile JSON.
// First it tries the LLM (accurate). If no API key is present, falls back to heuristics.
// The LLM call goes through OpenRouter (OpenAI-compatible /chat/completions).
const { z } = require('zod');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// --- Strict shape for the output. Whatever the LLM returns is validated against this. ---
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
- Extract BOTH directly stated info AND info that is INDIRECTLY present (inferable from the text). Do not invent anything that isn't supported by the resume.
- "location": if there is no explicit city/country at the top, INFER it from the most recent work experience or education line (e.g. an experience "HSBC Technology, Pune, India" => location "Pune, India"). Use the most recent / current one.
- "linkedin" / "website": fill ONLY if an actual URL is present in the text (e.g. "linkedin.com/in/..."). If the resume only shows the bare word "LinkedIn" / "Portfolio" as a hyperlink label with no visible URL, use null. NEVER output the literal word "LinkedIn" as a value.
- If a field is genuinely missing, use null (or [] for arrays).
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
      console.error('[resumeParser] LLM parse failed, falling back to heuristics:', err.message);
    }
  }

  return { data: heuristicParse(rawText), method: 'heuristic' };
}

async function parseWithLLM(rawText, apiKey) {
  // Parsing runs only once per resume — so we can use a strong (accurate) model,
  // the cost is negligible. You can override by setting the PARSE_MODEL env var.
  const model = process.env.PARSE_MODEL || 'anthropic/claude-3.5-sonnet';

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      // To nudge the model toward JSON-only output.
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
  return ProfileSchema.parse(json); // Zod validation — throws here on a wrong shape.
}

// The LLM sometimes wraps output in a ```json fence — strip it out.
function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found in LLM output');
  return JSON.parse(cleaned.slice(start, end + 1));
}

// --- Fallback: basic regex extraction without the LLM. ---
// Not perfect, but shows something even when no API key is available.
function heuristicParse(text) {
  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || null;
  const phone =
    text.match(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/)?.[0] || null;
  const linkedin = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[^\s)]+/i)?.[0] || null;

  // Treat the first non-empty line as the name (resumes usually have the name at the top).
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
