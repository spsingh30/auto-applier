// Job discovery — verified ATS boards se open jobs nikaal ke DB me daalta hai.
const { discover } = require('../services/autoapply/discover');
const applicationModel = require('../models/applicationModel');
const { BOARDS } = require('../services/autoapply/boards');

// POST /api/discover
// body (sab optional): { ats: string[], limitPerBoard: number, query: string }
// Note: sab boards chalane me 1-2 min lag sakta hai (polite rate-limit). ats/query se chhota karo.
async function run(req, res, next) {
  try {
    const { ats, limitPerBoard, query } = req.body || {};

    const result = await discover({
      ats: Array.isArray(ats) ? ats : undefined,
      limitPerBoard: Number.isFinite(limitPerBoard) ? limitPerBoard : 15,
      query: typeof query === 'string' ? query : undefined,
    });

    const { added, skipped } = await applicationModel.bulkCreateDiscovered(result.jobs);

    res.json({
      ok: true,
      discovered: result.jobs.length,
      added,
      skipped,
      boardsHit: result.boardsHit,
      boardsFailed: result.boardsFailed,
      errors: result.errors.slice(0, 20), // pehle 20 errors hi bhejo
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/discover/boards  -> kaunse ATS + kitne slugs available hain
function boards(req, res) {
  const summary = Object.fromEntries(Object.entries(BOARDS).map(([k, v]) => [k, v.length]));
  res.json({ ats: summary, total: Object.values(summary).reduce((a, b) => a + b, 0) });
}

module.exports = { run, boards };
