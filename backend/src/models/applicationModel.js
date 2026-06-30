// "Where we're applying" — the DB layer for Application records.
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

async function create(data) {
  return prisma.application.create({ data });
}

// Jobs from discovery — each new search should only show fresh results.
// So we first remove old DISCOVERED jobs (the ones the user didn't act on);
// applied/in-progress jobs (SUBMITTED/FILLED/PENDING/FAILED) are kept.
// Returns { added, skipped, removed }.
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

  // The same batch may also contain duplicate jobUrls — dedup.
  const fresh = [];
  for (const j of jobs) {
    if (!j.jobUrl || seen.has(j.jobUrl)) continue;
    seen.add(j.jobUrl);
    fresh.push({
      company: j.company || 'Unknown',
      jobTitle: j.jobTitle || 'Untitled',
      jobUrl: j.jobUrl,
      jobId: j.jobId || null,
      location: toLocationString(j.location),
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

module.exports = { listByProfile, listAll, create, updateStatus, bulkCreateDiscovered, countsByStatus };
