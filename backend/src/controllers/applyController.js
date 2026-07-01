// Apply (fill) phase controller — fills the form on a discovered job using Puppeteer.
// Default review mode: it fills the form, takes a screenshot, but does NOT submit.
const path = require('path');
const fs = require('fs');
const applicationModel = require('../models/applicationModel');
const profileModel = require('../models/profileModel');
const preferencesModel = require('../models/preferencesModel');
const { applyToJob, submitAllowed } = require('../services/autoapply/fill/apply');
const { supportedATS } = require('../services/autoapply/fill/adapters');
const { SHOTS_DIR } = require('../services/autoapply/fill/apply');

// POST /api/applications/:id/apply   body: { submit?: boolean }
async function apply(req, res, next) {
  try {
    const application = await applicationModel.getById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found.' });

    const profile = await profileModel.getLatest();
    if (!profile) return res.status(400).json({ error: 'Please upload a resume first (a profile is required).' });

    const resumePath = profile.resume?.storagePath || null;
    const prefs = await preferencesModel.get(); // the user's saved common answers

    const result = await applyToJob({
      application,
      profile,
      resumePath,
      prefs,
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

// GET /api/applications/:id/screenshot  -> PNG of the filled form
async function screenshot(req, res, next) {
  try {
    const file = path.join(SHOTS_DIR, `${req.params.id}.png`);
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Screenshot not found.' });
    res.type('png').sendFile(file);
  } catch (err) {
    next(err);
  }
}

// GET /api/apply/info -> for the UI: which ATS are supported, submit on/off
function info(req, res) {
  res.json({ supportedATS: supportedATS(), submitAllowed: submitAllowed() });
}

module.exports = { apply, screenshot, info };
