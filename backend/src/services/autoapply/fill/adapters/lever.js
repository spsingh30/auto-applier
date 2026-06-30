// Lever application form adapter.
// Posting page: https://jobs.lever.co/{slug}/{id}
// Apply form:   https://jobs.lever.co/{slug}/{id}/apply   (yahan fields hote hain)
// Fields name-based: name, email, phone, org (company), urls[LinkedIn], resume file.
// Custom cards: .application-question me inputs/textarea (name="cards[...][...]").
const { typeInto, attachFile, dismissBanners } = require('../formUtils');
const { fillRemaining } = require('../screeningFill');

async function fill(page, ctx) {
  const { profile, job, resumePath } = ctx;
  const notes = [];

  // Apply page pe jao (posting URL ke aage /apply).
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

  // Baaki sab fields (text/select/radio/checkbox) AI se bharo — "fill fully".
  await new Promise((r) => setTimeout(r, 800));
  const answers = await fillRemaining(page, profile, job, notes);
  return { notes, answers };
}

async function submit(page, notes) {
  const sel = ['button[type="submit"]', '#btn-submit', '.template-btn-submit', 'button.postings-btn'];
  for (const s of sel) {
    const btn = await page.$(s).catch(() => null);
    if (btn) {
      await btn.click().catch(() => {});
      notes.push(`submit: "${s}" dabaya`);
      await page.waitForNetworkIdle({ idleTime: 1500, timeout: 15000 }).catch(() => {});
      return true;
    }
  }
  notes.push('submit: button nahi mila');
  return false;
}

module.exports = { fill, submit };
