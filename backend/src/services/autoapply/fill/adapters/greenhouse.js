// Greenhouse application form adapter.
// Hosted form: https://job-boards.greenhouse.io/{slug}/jobs/{id}  (new React form)
//          or  https://boards.greenhouse.io/{slug}/jobs/{id}      (old)
// The standard fields have stable ids: first_name, last_name, email, phone, resume file input.
// Custom/screening questions are scraped and filled via the LLM.
const { typeInto, attachFile, dismissBanners, splitName } = require('../formUtils');
const { fillRemaining } = require('../screeningFill');

// Get the job's gh_jid (token) — prefer the stored jobId, otherwise from the jobUrl query.
function greenhouseToken(job) {
  if (job.jobId) return String(job.jobId);
  try {
    return new URL(job.jobUrl).searchParams.get('gh_jid');
  } catch {
    return null;
  }
}

// The URL of the actual fillable form. Many companies (elastic, samsara, ...) use their own custom
// career page (jobs.elastic.co) where the form fields aren't at the TOP LEVEL —
// there Puppeteer never finds #first_name/#email. Greenhouse's "embed" apply form
// resolves the board from just the token (no slug needed) and serves the form directly.
function greenhouseFormUrl(job) {
  const token = greenhouseToken(job);
  if (token) return `https://boards.greenhouse.io/embed/job_app?token=${encodeURIComponent(token)}`;
  return job.jobUrl; // last resort — if no token, fall back to the old behavior
}

// Go straight to the Greenhouse embed apply form (instead of custom career pages).
async function fill(page, ctx) {
  const { profile, job, resumePath, prefs } = ctx;
  const notes = [];
  const { first, last } = splitName(profile?.fullName);

  const formUrl = greenhouseFormUrl(job);
  if (formUrl !== job.jobUrl) notes.push(`greenhouse: used embed form (${formUrl})`);
  await page.goto(formUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await dismissBanners(page);
  // Let the form fields render.
  await page.waitForSelector('#first_name, input[name="first_name"], #email, input[type="email"]', { timeout: 15000 }).catch(() => {});

  // IMPORTANT: attach the resume FIRST. Greenhouse "analyzes" the resume and
  // re-renders/auto-fills the form — if attached later, the filled fields get cleared.
  notes.push((await attachFile(page, ['input#resume', 'input[type="file"][name*="resume" i]', 'input[type="file"]'], resumePath, 'resume')).note);
  await new Promise((r) => setTimeout(r, 1800)); // let analyze + auto-fill settle

  // Now fill the standard fields (overwriting whatever analyze got wrong/left blank).
  notes.push((await typeInto(page, ['#first_name', 'input[name="first_name"]', 'input[autocomplete="given-name"]'], first, 'first_name')).note);
  notes.push((await typeInto(page, ['#last_name', 'input[name="last_name"]', 'input[autocomplete="family-name"]'], last, 'last_name')).note);
  notes.push((await typeInto(page, ['#email', 'input[name="email"]', 'input[type="email"]'], profile?.email, 'email')).note);
  notes.push((await typeInto(page, ['#phone', 'input[name="phone"]', 'input[type="tel"]'], profile?.phone, 'phone')).note);

  // Fill everything else (text/select/radio/checkbox/combobox) via the AI — "fill fully".
  const answers = await fillRemaining(page, profile, job, notes, prefs);

  return { notes, answers };
}

// Submit button (only clicked when the caller passes submit:true).
async function submit(page, notes) {
  const sel = ['#submit_app', 'button[type="submit"]', 'input[type="submit"]'];
  for (const s of sel) {
    const btn = await page.$(s).catch(() => null);
    if (btn) {
      await btn.click().catch(() => {});
      notes.push(`submit: clicked "${s}"`);
      await page.waitForNetworkIdle({ idleTime: 1500, timeout: 15000 }).catch(() => {});
      return true;
    }
  }
  notes.push('submit: button not found');
  return false;
}

module.exports = { fill, submit };
