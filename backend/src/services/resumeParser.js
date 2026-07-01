// Raw resume text -> structured profile JSON.
// Tries the LLM first (accurate). If there's no API key, falls back to a heuristic.
// The LLM call goes through OpenRouter (OpenAI-compatible /chat/completions).
const { z } = require('zod');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// --- Strict output shape. Whatever the LLM returns is validated against this. ---
const ProfileSchema = z.object({
  fullName: z.string().nullable().default(null),
  email: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  linkedin: z.string().nullable().default(null),
  github: z.string().nullable().default(null),
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
  "github": string|null,
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
/**
 * @param {string} rawText
 * @param {string[]} [pdfUrls]  - URLs found from PDF annotations (most reliable for links)
 */
async function parseResume(rawText, pdfUrls = []) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    try {
      const data = await parseWithLLM(rawText, apiKey);
      // The LLM often misses exact URLs — confirm them via PDF annotations + regex.
      return { data: backfillLinks(data, rawText, pdfUrls), method: 'llm' };
    } catch (err) {
      console.error('[resumeParser] LLM parse failed, falling back to heuristic:', err.message);
    }
  }

  return { data: backfillLinks(heuristicParse(rawText), rawText, pdfUrls), method: 'heuristic' };
}

// Classify annotation/extra URLs into linkedin/github/website.
function classifyUrls(urls, fullName) {
  const tidy = (u) => u.replace(/[.,;)\]]+$/, '').replace(/\/$/, '');
  const list = (urls || []).filter((u) => u && !/^mailto:/i.test(u));
  const linkedin = list.find((u) => /linkedin\.com\/(in|pub)\//i.test(u));
  // GitHub: prefer the profile (github.com/user), not a repo (.../repo.git).
  const github =
    list.find((u) => /github\.com\/[^/]+\/?$/i.test(u) && !/\.git$/i.test(u)) ||
    list.find((u) => /github\.com/i.test(u) && !/\.git$/i.test(u));
  const nameKey = (fullName || '').toLowerCase().split(/\s+/)[0] || '';
  const sites = list.filter((u) => !/linkedin\.com|github\.com|twitter\.com|x\.com|facebook|instagram/i.test(u));
  const website =
    (nameKey && sites.find((u) => u.toLowerCase().includes(nameKey))) ||
    sites.find((u) => /netlify\.app|vercel\.app|github\.io|\.dev|\.me|portfolio/i.test(u)) ||
    sites[0];
  return {
    linkedin: linkedin ? tidy(linkedin) : null,
    github: github ? tidy(github) : null,
    website: website ? tidy(website) : null,
  };
}

// Extract LinkedIn/GitHub/website URLs from raw resume text (fill in what the LLM misses).
function extractLinks(text) {
  const t = text || '';
  const grab = (re) => {
    const m = t.match(re);
    if (!m) return null;
    let url = m[0].replace(/[.,;)\]]+$/, ''); // strip trailing punctuation
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    return url;
  };
  const linkedin = grab(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[A-Za-z0-9_%-]+\/?/i);
  const github = grab(/(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+\/?/i);

  // Website: any URL that isn't social/email. Prefer portfolio domains (netlify/vercel/github.io/.dev).
  let website = grab(
    /(?:https?:\/\/)?(?:www\.)?[A-Za-z0-9-]+\.(?:netlify\.app|vercel\.app|github\.io|web\.app|dev|me|page|portfolio)[A-Za-z0-9./_-]*/i
  );
  if (!website) {
    const urls = t.match(/(?:https?:\/\/)[A-Za-z0-9.-]+\.[A-Za-z]{2,}[A-Za-z0-9./_#?=&%-]*/gi) || [];
    const skip = /linkedin\.com|github\.com|twitter\.com|x\.com|facebook\.com|instagram\.com|mailto:|gmail\.com|gravatar/i;
    const cand = urls.find((u) => !skip.test(u));
    if (cand) website = cand.replace(/[.,;)\]]+$/, '');
  }
  return { linkedin, github, website };
}

// Fill in missing links — priority: PDF annotations > text-regex > LLM-guess.
function backfillLinks(data, rawText, pdfUrls = []) {
  const ann = classifyUrls(pdfUrls, data.fullName);
  const txt = extractLinks(rawText);
  return {
    ...data,
    linkedin: ann.linkedin || data.linkedin || txt.linkedin || null,
    github: ann.github || data.github || txt.github || null,
    website: ann.website || data.website || txt.website || null,
  };
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
      // To nudge toward JSON-only output.
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
  return ProfileSchema.parse(json); // Zod validation — errors out here on a wrong shape.
}

// The LLM sometimes wraps output in a ```json fence — strip it out.
function extractJson(text) {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found in the LLM output');
  return JSON.parse(cleaned.slice(start, end + 1));
}

// --- Fallback: basic regex extraction without the LLM. ---
// Not perfect, but shows something even when there's no API key.
function heuristicParse(text) {
  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || null;
  const phone =
    text.match(/(\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}/)?.[0] || null;
  const linkedin = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[^\s)]+/i)?.[0] || null;

  // Assume the first non-empty line is the name (the name is usually at the top of a resume).
  const firstLine =
    text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0 && l.length < 50 && !l.includes('@')) || null;

  // Scan for common skill keywords.
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
