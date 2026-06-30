// ATS -> adapter registry. job.ats se sahi adapter chuna jaata hai.
// Naye ATS support karne ke liye yahan ek line add karo (greenhouse/lever template copy karke).
const greenhouse = require('./greenhouse');
const lever = require('./lever');

const ADAPTERS = {
  greenhouse,
  lever,
  // ashby, workable, smartrecruiters — TODO (in ke form alag; fill template same).
};

function getAdapter(ats) {
  return ADAPTERS[(ats || '').toLowerCase()] || null;
}

function supportedATS() {
  return Object.keys(ADAPTERS);
}

module.exports = { getAdapter, supportedATS };
