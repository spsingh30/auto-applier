// Fill orchestrator — fills the apply form for a discovered job (Puppeteer).
//
// Default = REVIEW MODE: fills the form and takes a screenshot, does NOT SUBMIT.
// The user reviews the screenshot, then submits if they want. A real submit is behind two gates:
//   1) the caller explicitly passes submit:true, AND
//   2) env ALLOW_SUBMIT=true is set.
// This design is intentional — so we don't accidentally spam real companies.
const fs = require('fs');
const path = require('path');
const { newPage } = require('./browser');
const { getAdapter, supportedATS } = require('./adapters');

const SHOTS_DIR = path.join(__dirname, '..', '..', '..', '..', 'screenshots');

function ensureShots() {
  if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

// When clearing jobs, also remove old filled-form screenshots (so no orphans remain).
function clearScreenshots() {
  try {
    if (!fs.existsSync(SHOTS_DIR)) return;
    for (const f of fs.readdirSync(SHOTS_DIR)) {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS_DIR, f));
    }
  } catch (e) {
    console.error('[apply] screenshot cleanup failed:', e.message);
  }
}

function submitAllowed() {
  return String(process.env.ALLOW_SUBMIT || '').toLowerCase() === 'true';
}

/**
 * @param {object} args
 * @param {object} args.application - DB application row ({ id, company, jobTitle, jobUrl, ats, ... })
 * @param {object} args.profile     - profileModel.getLatest() (skills/experiences included)
 * @param {string|null} args.resumePath - path to the resume file on disk (attached if present)
 * @param {boolean} [args.submit]   - actual submit only when true + ALLOW_SUBMIT=true
 * @returns {Promise<{ status, screenshotPath, notes, answers, submitted, error? }>}
 */
async function applyToJob({ application, profile, resumePath, prefs = {}, submit = false }) {
  const job = {
    jobUrl: application.jobUrl,
    jobId: application.jobId,
    company: application.company,
    jobTitle: application.jobTitle,
    location: application.location,
  };

  const adapter = getAdapter(application.ats);
  if (!adapter) {
    return {
      status: 'FAILED',
      screenshotPath: null,
      notes: [`no adapter for this ATS ("${application.ats}"). Supported: ${supportedATS().join(', ')}`],
      answers: [],
      submitted: false,
      error: 'unsupported_ats',
    };
  }
  if (!job.jobUrl) {
    return { status: 'FAILED', screenshotPath: null, notes: ['jobUrl missing'], answers: [], submitted: false, error: 'no_url' };
  }

  ensureShots();
  const page = await newPage();
  const notes = [];
  let answers = [];
  let submitted = false;
  let status = 'FILLED';
  let error;

  try {
    const res = await adapter.fill(page, { profile, job, resumePath, prefs });
    notes.push(...(res.notes || []));
    answers = res.answers || [];

    // --- Submit gate ---
    if (submit && submitAllowed()) {
      submitted = await adapter.submit(page, notes);
      status = submitted ? 'SUBMITTED' : 'FILLED';
    } else if (submit && !submitAllowed()) {
      notes.push('submit skipped: ALLOW_SUBMIT=true is not set in env (safety). Left in review mode.');
    } else {
      notes.push('review mode: form filled, not submitted. Check the screenshot.');
    }
  } catch (e) {
    status = 'FAILED';
    error = e.message;
    notes.push(`apply error: ${e.message}`);
  }

  // Always take a screenshot (review/debug). Let it settle a bit first
  // (resume "analyzing", dynamic fields, reflow) — otherwise we get a half-rendered shot.
  let screenshotPath = null;
  try {
    await new Promise((r) => setTimeout(r, 1200));
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    const file = path.join(SHOTS_DIR, `${application.id}.png`);
    await page.screenshot({ path: file, fullPage: true });
    screenshotPath = file;
  } catch (e) {
    notes.push(`screenshot failed: ${e.message}`);
  }

  // In headed mode we could leave the page open, but for background apply we close it.
  await page.close().catch(() => {});

  return { status, screenshotPath, notes, answers, submitted, error };
}

module.exports = { applyToJob, submitAllowed, clearScreenshots, SHOTS_DIR };
