// "Where are we applying" — DB layer for application records.
const prisma = require('../config/prisma');

// Safety net: the DB needs location as a String. If some ATS sends an object/array,
// convert it to a clean string (or null), otherwise Prisma crashes.
function toLocationString(loc) {
  if (loc == null) return null;
  if (typeof loc === 'string') return loc.trim() || null;
  if (typeof loc === 'object') {
    return (
      loc.display ||
      [loc.city, loc.region, loc.state, loc.country].filter(Boolean).join(', ') ||
      loc.name ||
      null
    );
  }
  return String(loc);
}

async function listByProfile(profileId) {
  return prisma.application.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
  });
}

async function listAll() {
  return prisma.application.findMany({ orderBy: { createdAt: 'desc' } });
}

async function getById(id) {
  return prisma.application.findUnique({ where: { id } });
}

// Delete all applications (clean slate before a fresh discover).
// Returns { count } — how many rows were deleted.
async function deleteAll() {
  const { count } = await prisma.application.deleteMany({});
  return { count };
}

async function create(data) {
  return prisma.application.create({ data });
}

// Always coerce location to string|null — so the insert won't break even if an ATS returns an object/array.
function toLocationString(loc) {
  if (loc == null) return null;
  if (typeof loc === 'string') return loc.trim() || null;
  if (typeof loc === 'object') {
    return loc.display || [loc.city, loc.region, loc.country].filter(Boolean).join(', ') || null;
  }
  return String(loc);
}

// Jobs from discovery — only insert those whose jobUrl isn't already in the DB.
// Returns { added, skipped }.
async function bulkCreateDiscovered(jobs) {
  // 1) Clear out old untouched discovered results.
  const { count: removed } = await prisma.application.deleteMany({
    where: { status: 'DISCOVERED' },
  });

  // 2) Dedup against the remaining applied/in-progress jobs (so they aren't added again).
  const urls = jobs.map((j) => j.jobUrl).filter(Boolean);
  const existing = await prisma.application.findMany({
    where: { jobUrl: { in: urls } },
    select: { jobUrl: true },
  });
  const seen = new Set(existing.map((e) => e.jobUrl));

  // The same batch can also contain a duplicate jobUrl — dedup.
  const fresh = [];
  for (const j of jobs) {
    if (!j.jobUrl || seen.has(j.jobUrl)) continue;
    seen.add(j.jobUrl);
    fresh.push({
      company: j.company || 'Unknown',
      jobTitle: j.jobTitle || 'Untitled',
      jobUrl: j.jobUrl,
      jobId: j.jobId || null,
      location: toLocationString(j.location), // never pass an object (SQLite/Prisma expects a string)
      ats: j.ats || null,
      status: 'DISCOVERED',
    });
  }

  if (fresh.length) await prisma.application.createMany({ data: fresh });
  return { added: fresh.length, skipped: jobs.length - fresh.length, removed };
}

// Counts by status — for the dashboard summary.
async function countsByStatus() {
  const rows = await prisma.application.groupBy({ by: ['status'], _count: { status: true } });
  return rows.reduce((acc, r) => ({ ...acc, [r.status]: r._count.status }), {});
}

async function updateStatus(id, status) {
  const patch = { status };
  if (status === 'SUBMITTED') patch.appliedAt = new Date();
  return prisma.application.update({ where: { id }, data: patch });
}

// Save the result of the fill/apply phase (status + screenshot + notes/answers).
async function saveFillResult(id, { status, screenshotPath, notes, answers, profileId }) {
  const patch = {
    status,
    filledAt: new Date(),
    screenshotPath: screenshotPath || null,
    fillNotes: JSON.stringify({ notes: notes || [], answers: answers || [] }),
  };
  if (status === 'SUBMITTED') patch.appliedAt = new Date();
  if (profileId) patch.profileId = profileId; // link to the profile at apply time
  return prisma.application.update({ where: { id }, data: patch });
}

module.exports = {
  listByProfile, listAll, getById, create, updateStatus,
  bulkCreateDiscovered, countsByStatus, saveFillResult, deleteAll,
};
