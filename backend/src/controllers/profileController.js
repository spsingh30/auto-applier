// Profile read endpoints — the dashboard gets its data from these.
const profileModel = require('../models/profileModel');

// GET /api/profile         -> latest profile (MVP single-user)
async function getLatest(req, res, next) {
  try {
    const profile = await profileModel.getLatest();
    if (!profile) return res.status(404).json({ error: 'No resume has been uploaded yet.' });
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

// GET /api/profile/:id
async function getById(req, res, next) {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found.' });
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/profile/:id  -> update editable fields
async function update(req, res, next) {
  try {
    const profile = await profileModel.update(req.params.id, req.body || {});
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLatest, getById, update };
