// Fill orchestrator — ek discovered job pe apply form bharta hai (Puppeteer).
//
// Default = REVIEW MODE: form bhar ke screenshot le leta hai, SUBMIT NAHI karta.
// User screenshot dekhe, phir chahe to submit kare. Asli submit do gates ke peeche:
//   1) caller explicitly submit:true bheje, AUR
//   2) env ALLOW_SUBMIT=true ho.
// Ye design jaan-bujh ke hai — galti se real companies ko spam na ho.
const fs = require('fs');
const path = require('path');
const { newPage } = require('./browser');
const { getAdapter, supportedATS } = require('./adapters');

const SHOTS_DIR = path.join(__dirname, '..', '..', '..', '..', 'screenshots');

function ensureShots() {
  if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });
}

// Jobs clear karte time purane filled-form screenshots bhi hata do (orphan na rahein).
function clearScreenshots() {
  try {
    if (!fs.existsSync(SHOTS_DIR)) return;
    for (const f of fs.readdirSync(SHOTS_DIR)) {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS_DIR, f));
    }
  } catch (e) {
    console.error('[apply] screenshot cleanup fail:', e.message);
  }
}

function submitAllowed() {
  return String(process.env.ALLOW_SUBMIT || '').toLowerCase() === 'true';
}

/**
 * @param {object} args
 * @param {object} args.application - DB application row ({ id, company, jobTitle, jobUrl, ats, ... })
 * @param {object} args.profile     - profileModel.getLatest() (skills/experiences included)
 * @param {string|null} args.resumePath - disk pe resume file ka path (ho to attach hoga)
 * @param {boolean} [args.submit]   - true + ALLOW_SUBMIT=true tabhi actual submit
 * @returns {Promise<{ status, screenshotPath, notes, answers, submitted, error? }>}
 */
async function applyToJob({ application, profile, resumePath, submit = false }) {
  const job = {
    jobUrl: application.jobUrl,
    company: application.company,
    jobTitle: application.jobTitle,
    location: application.location,
  };

  const adapter = getAdapter(application.ats);
  if (!adapter) {
    return {
      status: 'FAILED',
      screenshotPath: null,
      notes: [`is ATS ("${application.ats}") ke liye adapter nahi. Supported: ${supportedATS().join(', ')}`],
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
    const res = await adapter.fill(page, { profile, job, resumePath });
    notes.push(...(res.notes || []));
    answers = res.answers || [];

    // --- Submit gate ---
    if (submit && submitAllowed()) {
      submitted = await adapter.submit(page, notes);
      status = submitted ? 'SUBMITTED' : 'FILLED';
    } else if (submit && !submitAllowed()) {
      notes.push('submit skip: ALLOW_SUBMIT=true env me set nahi hai (safety). Review mode me chhoda.');
    } else {
      notes.push('review mode: form bhara, submit nahi kiya. Screenshot dekho.');
    }
  } catch (e) {
    status = 'FAILED';
    error = e.message;
    notes.push(`apply error: ${e.message}`);
  }

  // Screenshot hamesha lo (review/debug). Pehle thoda settle hone do
  // (resume "analyzing", dynamic fields, reflow) — warna aadha-rendered shot aata hai.
  let screenshotPath = null;
  try {
    await new Promise((r) => setTimeout(r, 2500));
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
    const file = path.join(SHOTS_DIR, `${application.id}.png`);
    await page.screenshot({ path: file, fullPage: true });
    screenshotPath = file;
  } catch (e) {
    notes.push(`screenshot fail: ${e.message}`);
  }

  // Headed mode me page khula chhod sakte the, par background apply ke liye band kar dete hain.
  await page.close().catch(() => {});

  return { status, screenshotPath, notes, answers, submitted, error };
}

module.exports = { applyToJob, submitAllowed, clearScreenshots, SHOTS_DIR };
