// "Hum kahan apply kar rahe hain" — Application records ki DB layer.
const prisma = require('../config/prisma');

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

// Discovery se aaye jobs — jo jobUrl pehle se DB me nahi hai sirf wahi insert.
// Returns { added, skipped }.
async function bulkCreateDiscovered(jobs) {
  const urls = jobs.map((j) => j.jobUrl).filter(Boolean);
  const existing = await prisma.application.findMany({
    where: { jobUrl: { in: urls } },
    select: { jobUrl: true },
  });
  const seen = new Set(existing.map((e) => e.jobUrl));

  // Same batch ke andar bhi duplicate jobUrl ho sakta hai — dedup.
  const fresh = [];
  for (const j of jobs) {
    if (!j.jobUrl || seen.has(j.jobUrl)) continue;
    seen.add(j.jobUrl);
    fresh.push({
      company: j.company || 'Unknown',
      jobTitle: j.jobTitle || 'Untitled',
      jobUrl: j.jobUrl,
      jobId: j.jobId || null,
      location: j.location || null,
      ats: j.ats || null,
      status: 'DISCOVERED',
    });
  }

  if (fresh.length) await prisma.application.createMany({ data: fresh });
  return { added: fresh.length, skipped: jobs.length - fresh.length };
}

// Status-wise counts — dashboard summary ke liye.
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
