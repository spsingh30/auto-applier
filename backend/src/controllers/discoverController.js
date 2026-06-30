// Job discovery — pulls open jobs from verified ATS boards and stores them in the DB.
const { discover } = require('../services/autoapply/discover');
const applicationModel = require('../models/applicationModel');
const profileModel = require('../models/profileModel');
const { suggestKeywords } = require('../services/autoapply/keywords');
const { BOARDS } = require('../services/autoapply/boards');

// POST /api/discover
// body (all optional): { ats: string[], limitPerBoard: number, query: string }
// Note: running all boards can take 1-2 min (polite rate-limit). Narrow it down with ats/query.
async function run(req, res, next) {
  try {
    const { ats, limitPerBoard, query, queries } = req.body || {};

    const result = await discover({
      ats: Array.isArray(ats) ? ats : undefined,
      limitPerBoard: Number.isFinite(limitPerBoard) ? limitPerBoard : 15,
      query: typeof query === 'string' ? query : undefined,
      queries: Array.isArray(queries) ? queries : undefined,
    });

    const { added, skipped, removed } = await applicationModel.bulkCreateDiscovered(result.jobs);

    res.json({
      ok: true,
      discovered: result.jobs.length,
      added,
      skipped,
      removed,
      boardsHit: result.boardsHit,
      boardsFailed: result.boardsFailed,
      errors: result.errors.slice(0, 20), // only send the first 20 errors
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/discover/boards  -> which ATS and how many slugs are available
function boards(req, res) {
  const summary = Object.fromEntries(Object.entries(BOARDS).map(([k, v]) => [k, v.length]));
  res.json({ ats: summary, total: Object.values(summary).reduce((a, b) => a + b, 0) });
}

// GET /api/discover/keywords  -> suggested job keywords from the latest resume
async function keywords(req, res, next) {
  try {
    const profile = await profileModel.getLatest();
    const list = await suggestKeywords(profile);
    res.json({ keywords: list });
  } catch (err) {
    next(err);
  }
}

module.exports = { run, boards, keywords };
