// Auto-fill job forms with AI + Puppeteer (does not submit yet).
const { autofillJob } = require('../services/autofill');
const profileModel = require('../models/profileModel');

// POST /api/autofill  body: { jobUrl, profileId? }
async function run(req, res, next) {
  try {
    const { jobUrl, profileId } = req.body || {};
    if (!jobUrl) return res.status(400).json({ error: 'jobUrl is required' });

    const profile = profileId
      ? await profileModel.getById(profileId)
      : await profileModel.getLatest();

    const result = await autofillJob(jobUrl, profile);

    // Compute coverage of required (compulsory ⭐) fields.
    const filledSelectors = new Set(result.filled.map((f) => f.selector));
    const requiredFields = result.fields.filter((f) => f.required);
    const requiredEmpty = requiredFields
      .filter((f) => !filledSelectors.has(f.selector))
      .map((f) => f.label || f.selector);

    res.json({
      ok: true,
      jobUrl: result.jobUrl,
      fieldCount: result.fields.length,
      filled: result.filled, // [{ selector, value }]
      resumeUploaded: result.resumeUploaded, // whether the resume/CV was attached
      required: { total: requiredFields.length, filled: requiredFields.length - requiredEmpty.length, empty: requiredEmpty },
      screenshot: `data:image/png;base64,${result.screenshot}`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { run };
