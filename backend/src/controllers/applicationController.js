// Applications — the dashboard's "where we're applying" section.
const applicationModel = require('../models/applicationModel');
const profileModel = require('../models/profileModel');

// GET /api/applications  -> all applications
async function list(req, res, next) {
  try {
    const applications = await applicationModel.listAll();
    res.json({ applications });
  } catch (err) {
    next(err);
  }
}

// POST /api/applications  -> add a new application (manual for now; later done by the extension/crawler)
async function create(req, res, next) {
  try {
    let { profileId, company, jobTitle, jobUrl, ats, status } = req.body;

    if (!company || !jobTitle) {
      return res.status(400).json({ error: 'company and jobTitle are required.' });
    }

    // If no profileId is provided, attach to the latest profile.
    if (!profileId) {
      const latest = await profileModel.getLatest();
      if (!latest) return res.status(400).json({ error: 'Upload a resume first.' });
      profileId = latest.id;
    }

    const application = await applicationModel.create({
      profileId,
      company,
      jobTitle,
      jobUrl: jobUrl || null,
      ats: ats || null,
      status: status || 'PENDING',
    });

    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/applications/:id/status
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['PENDING', 'FILLED', 'SUBMITTED', 'FAILED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const application = await applicationModel.updateStatus(req.params.id, status);
    res.json({ application });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, updateStatus };
