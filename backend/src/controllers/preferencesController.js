// Preferences endpoints — common application answers (questionnaire).
const preferencesModel = require('../models/preferencesModel');
const { QUESTIONS } = require('../services/autoapply/preferences');

// GET /api/preferences -> { questions, answers }
async function get(req, res, next) {
  try {
    const answers = await preferencesModel.get();
    res.json({ questions: QUESTIONS, answers });
  } catch (err) {
    next(err);
  }
}

// PUT /api/preferences  body: { answers: {key: value} }
async function save(req, res, next) {
  try {
    const answers = (req.body && req.body.answers) || {};
    // keep only known keys (safety)
    const allowed = new Set(QUESTIONS.map((q) => q.key));
    const clean = {};
    for (const [k, v] of Object.entries(answers)) if (allowed.has(k)) clean[k] = v;
    const saved = await preferencesModel.save(clean);
    res.json({ ok: true, answers: saved });
  } catch (err) {
    next(err);
  }
}

module.exports = { get, save };
