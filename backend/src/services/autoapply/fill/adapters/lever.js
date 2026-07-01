// Lever application form adapter.
// Posting page: https://jobs.lever.co/{slug}/{id}
// Apply form:   https://jobs.lever.co/{slug}/{id}/apply   (the fields live here)
// Fields are name-based: name, email, phone, org (company), urls[LinkedIn], resume file.
// Custom cards: inputs/textarea inside .application-question (name="cards[...][...]").
const { typeInto, attachFile, dismissBanners } = require('../formUtils');
const { fillRemaining } = require('../screeningFill');

async function fill(page, ctx) {
  const { profile, job, resumePath, prefs } = ctx;
  const notes = [];

  // Go to the apply page (posting URL with /apply appended).
  const applyUrl = /\/apply\/?$/.test(job.jobUrl) ? job.jobUrl : `${job.jobUrl.replace(/\/$/, '')}/apply`;
  await page.goto(applyUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await dismissBanners(page);
  await page.waitForSelector('input[name="name"], input[name="email"]', { timeout: 15000 }).catch(() => {});

  notes.push((await typeInto(page, ['input[name="name"]'], profile?.fullName, 'name')).note);
  notes.push((await typeInto(page, ['input[name="email"]'], profile?.email, 'email')).note);
  notes.push((await typeInto(page, ['input[name="phone"]'], profile?.phone, 'phone')).note);
  notes.push((await typeInto(page, ['input[name="org"]'], profile?.experiences?.[0]?.company, 'current company')).note);
  if (profile?.linkedin) {
    notes.push((await typeInto(page, ['input[name="urls[LinkedIn]"]', 'input[name*="LinkedIn" i]'], profile.linkedin, 'linkedin')).note);
  }

  notes.push((await attachFile(page, ['input[name="resume"]', 'input[type="file"]'], resumePath, 'resume')).note);

  // Fill all remaining fields (text/select/radio/checkbox) via the AI — "fill fully".
  await new Promise((r) => setTimeout(r, 800));
  const answers = await fillRemaining(page, profile, job, notes, prefs);
  return { notes, answers };
}

async function submit(page, notes) {
  const sel = ['button[type="submit"]', '#btn-submit', '.template-btn-submit', 'button.postings-btn'];
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
