// ATS -> adapter registry. The right adapter is chosen from job.ats.
// To support a new ATS, add a line here (copy the greenhouse/lever template).
const greenhouse = require('./greenhouse');
const lever = require('./lever');

const ADAPTERS = {
  greenhouse,
  lever,
  // ashby, workable, smartrecruiters — TODO (their forms differ; fill template is the same).
};

function getAdapter(ats) {
  return ADAPTERS[(ats || '').toLowerCase()] || null;
}

function supportedATS() {
  return Object.keys(ADAPTERS);
}

module.exports = { getAdapter, supportedATS };
