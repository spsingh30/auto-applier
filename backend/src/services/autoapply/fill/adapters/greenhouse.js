// Greenhouse application form adapter.
// Hosted form: https://job-boards.greenhouse.io/{slug}/jobs/{id}  (naya React form)
//          ya  https://boards.greenhouse.io/{slug}/jobs/{id}      (purana)
// Standard fields ke ids stable hain: first_name, last_name, email, phone, resume file input.
// Custom/screening questions ko scrape karke LLM se bharte hain.
const { typeInto, attachFile, dismissBanners, splitName } = require('../formUtils');
const { fillRemaining } = require('../screeningFill');

// Greenhouse pe "Apply" form usually job page pe hi inline hota hai (scroll). Direct URL kaafi.
async function fill(page, ctx) {
  const { profile, job, resumePath } = ctx;
  const notes = [];
  const { first, last } = splitName(profile?.fullName);

  await page.goto(job.jobUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await dismissBanners(page);
  // Form fields render hone do.
  await page.waitForSelector('#first_name, input[name="first_name"], #email, input[type="email"]', { timeout: 15000 }).catch(() => {});

  // IMPORTANT: resume PEHLE attach karo. Greenhouse resume "analyze" karke form
  // re-render/auto-fill karta hai — agar baad me attach kiya to bhare fields clear ho jaate hain.
  notes.push((await attachFile(page, ['input#resume', 'input[type="file"][name*="resume" i]', 'input[type="file"]'], resumePath, 'resume')).note);
  await new Promise((r) => setTimeout(r, 2500)); // analyze + auto-fill settle hone do

  // Ab standard fields bharo (analyze ne jo galat/khaali kiya, overwrite ho jaata hai).
  notes.push((await typeInto(page, ['#first_name', 'input[name="first_name"]', 'input[autocomplete="given-name"]'], first, 'first_name')).note);
  notes.push((await typeInto(page, ['#last_name', 'input[name="last_name"]', 'input[autocomplete="family-name"]'], last, 'last_name')).note);
  notes.push((await typeInto(page, ['#email', 'input[name="email"]', 'input[type="email"]'], profile?.email, 'email')).note);
  notes.push((await typeInto(page, ['#phone', 'input[name="phone"]', 'input[type="tel"]'], profile?.phone, 'phone')).note);

  // Baaki sab (text/select/radio/checkbox/combobox) AI se bharo — "fill fully".
  const answers = await fillRemaining(page, profile, job, notes);

  return { notes, answers };
}

// Submit button (sirf tab dabate hain jab caller submit:true bheje).
async function submit(page, notes) {
  const sel = ['#submit_app', 'button[type="submit"]', 'input[type="submit"]'];
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
