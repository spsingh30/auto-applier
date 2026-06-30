// Discovery layer — hits each ATS's public (no-auth) JSON API to pull open jobs.
// No browser/Puppeteer here — APIs only. Fill/submit is a later phase.
// Output: normalized job objects { company, jobTitle, jobUrl, jobId, location, ats }.
const { BOARDS } = require('./boards');

const CONCURRENCY = 6; // scan this many boards at once — 6x faster, but still polite enough.
const TIMEOUT_MS = 9000;

// slug -> "Nice Company" (best-effort display name).
function prettyCompany(slug) {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Fetch with an AbortController (so it doesn't hang).
async function getJson(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (autoresumeapply discovery)', ...(opts.headers || {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// --- Per-ATS fetchers: slug -> normalized jobs[] ---

async function fromGreenhouse(slug) {
  const b = await getJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
  return (b.jobs || []).map((j) => ({
    company: prettyCompany(slug),
    jobTitle: j.title,
    jobUrl: j.absolute_url,
    jobId: String(j.id),
    location: j.location?.name || null,
    ats: 'greenhouse',
  }));
}

async function fromLever(slug) {
  const arr = await getJson(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  return (arr || []).map((j) => ({
    company: prettyCompany(slug),
    jobTitle: j.text,
    jobUrl: j.hostedUrl,
    jobId: j.id,
    location: j.categories?.location || null,
    ats: 'lever',
  }));
}

async function fromAshby(slug) {
  const b = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`);
  return (b.jobs || []).map((j) => ({
    company: prettyCompany(slug),
    jobTitle: j.title,
    jobUrl: j.jobUrl || j.applyUrl || `https://jobs.ashbyhq.com/${slug}/${j.id}`,
    jobId: j.id,
    location: j.location || j.locationName || null,
    ats: 'ashby',
  }));
}

async function fromSmartRecruiters(slug) {
  const b = await getJson(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`);
  return (b.content || []).map((j) => ({
    company: prettyCompany(slug),
    jobTitle: j.name,
    jobUrl: `https://careers.smartrecruiters.com/${slug}/${j.id}`,
    jobId: String(j.id),
    location: [j.location?.city, j.location?.country].filter(Boolean).join(', ') || null,
    ats: 'smartrecruiters',
  }));
}

// Workable sometimes returns location as a string, sometimes as an object ({ display, city, country, ... }).
// Always return a clean string (or null) — the DB only wants a String.
function workableLocation(j) {
  const fromParts = [j.city, j.country].filter(Boolean).join(', ');
  if (fromParts) return fromParts;
  const loc = j.location;
  if (!loc) return null;
  if (typeof loc === 'string') return loc;
  return loc.display || [loc.city, loc.region, loc.country].filter(Boolean).join(', ') || null;
}

async function fromWorkable(slug) {
  const b = await getJson(`https://apply.workable.com/api/v3/accounts/${slug}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '', location: [], department: [], worktype: [], remote: [] }),
  });
  return (b.results || []).map((j) => ({
    company: prettyCompany(slug),
    jobTitle: j.title,
    jobUrl: j.url || `https://apply.workable.com/${slug}/j/${j.shortcode}/`,
    jobId: j.shortcode || j.id || null,
    location: workableLocation(j),
    ats: 'workable',
  }));
}

const FETCHERS = {
  greenhouse: fromGreenhouse,
  lever: fromLever,
  ashby: fromAshby,
  smartrecruiters: fromSmartRecruiters,
  workable: fromWorkable,
};

/**
 * Discover all (or selected) boards.
 * @param {object} opts
 * @param {string[]} [opts.ats]          - which ATS (default: all)
 * @param {number}   [opts.limitPerBoard]- max jobs per board (default 15)
 * @param {string}   [opts.query]        - keep only if the title contains this keyword (optional, single)
 * @param {string[]} [opts.queries]      - keep if the title contains ANY of these keywords (optional, multi)
 * @param {function} [opts.onProgress]   - (info) => void  for live logging
 * @returns {Promise<{ jobs: object[], boardsHit: number, boardsFailed: number, errors: object[] }>}
 */
async function discover(opts = {}) {
  const atsList = (opts.ats && opts.ats.length ? opts.ats : Object.keys(BOARDS)).filter((a) => FETCHERS[a]);
  const limitPerBoard = opts.limitPerBoard ?? 15;
  // Combine queries[] (multi) + query (single) into a single lowercase keyword list.
  const keywords = [...(opts.queries || []), opts.query]
    .map((k) => (k || '').trim().toLowerCase())
    .filter(Boolean);
  const onProgress = opts.onProgress || (() => {});

  // All (ats, slug) tasks in one flat list — then CONCURRENCY workers run in parallel.
  const tasks = [];
  for (const ats of atsList) for (const slug of BOARDS[ats]) tasks.push({ ats, slug });

  const jobs = [];
  const errors = [];
  let boardsHit = 0;
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const { ats, slug } = tasks[next++];
      try {
        let found = await FETCHERS[ats](slug);
        if (keywords.length) {
          found = found.filter((j) => {
            const title = (j.jobTitle || '').toLowerCase();
            return keywords.some((k) => title.includes(k));
          });
        }
        if (limitPerBoard > 0) found = found.slice(0, limitPerBoard);
        jobs.push(...found);
        boardsHit++;
        onProgress({ ats, slug, count: found.length });
      } catch (err) {
        errors.push({ ats, slug, error: err.message });
        onProgress({ ats, slug, error: err.message });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, worker));

  return { jobs, boardsHit, boardsFailed: errors.length, errors };
}

module.exports = { discover, FETCHERS };
