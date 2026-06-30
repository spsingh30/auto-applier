// Apply (fill) phase controller — ek discovered job pe Puppeteer se form bharta hai.
// Default review mode: bharta hai, screenshot leta hai, submit NAHI karta.
const path = require('path');
const fs = require('fs');
const applicationModel = require('../models/applicationModel');
const profileModel = require('../models/profileModel');
const { applyToJob, submitAllowed } = require('../services/autoapply/fill/apply');
const { supportedATS } = require('../services/autoapply/fill/adapters');
const { SHOTS_DIR } = require('../services/autoapply/fill/apply');

// POST /api/applications/:id/apply   body: { submit?: boolean }
async function apply(req, res, next) {
  try {
    const application = await applicationModel.getById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application nahi mili.' });

    const profile = await profileModel.getLatest();
    if (!profile) return res.status(400).json({ error: 'Pehle resume upload karo (profile chahiye).' });

    const resumePath = profile.resume?.storagePath || null;

    const result = await applyToJob({
      application,
      profile,
      resumePath,
      submit: req.body?.submit === true,
    });

    const saved = await applicationModel.saveFillResult(application.id, {
      status: result.status,
      screenshotPath: result.screenshotPath,
      notes: result.notes,
      answers: result.answers,
      profileId: profile.id,
    });

    res.json({
      ok: result.status !== 'FAILED',
      application: saved,
      submitted: result.submitted,
      submitAllowed: submitAllowed(),
      screenshotUrl: result.screenshotPath ? `/api/applications/${application.id}/screenshot` : null,
      notes: result.notes,
      answers: result.answers,
      resumeAttached: !!resumePath,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/applications/:id/screenshot  -> bhare hue form ka PNG
async function screenshot(req, res, next) {
  try {
    const file = path.join(SHOTS_DIR, `${req.params.id}.png`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Screenshot nahi mila.' });
    res.type('png').sendFile(file);
  } catch (err) {
    next(err);
  }
}

// GET /api/apply/info -> UI ke liye: kaunse ATS supported, submit on/off
function info(req, res) {
  res.json({ supportedATS: supportedATS(), submitAllowed: submitAllowed() });
}

module.exports = { apply, screenshot, info };
