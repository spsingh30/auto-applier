// Profile read endpoints — dashboard inhi se data leta hai.
const profileModel = require('../models/profileModel');

// GET /api/profile         -> latest profile (MVP single-user)
async function getLatest(req, res, next) {
  try {
    const profile = await profileModel.getLatest();
    if (!profile) return res.status(404).json({ error: 'Abhi koi resume upload nahi hua.' });
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

// GET /api/profile/:id
async function getById(req, res, next) {
  try {
    const profile = await profileModel.getById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile nahi mila.' });
    res.json({ profile });
  } catch (err) {
    next(err);
  }
}

module.exports = { getLatest, getById };
