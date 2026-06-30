// All profile-related DB operations live here. Controllers never touch Prisma directly.
const prisma = require('../config/prisma');

// Parsed data (from the services) -> create Profile + relations.
async function createFromParsed(parsed, fileMeta) {
  return prisma.profile.create({
    data: {
      fullName: parsed.fullName,
      email: parsed.email,
      phone: parsed.phone,
      location: parsed.location,
      linkedin: parsed.linkedin,
      website: parsed.website,
      summary: parsed.summary,
      skills: JSON.stringify(parsed.skills || []), // SQLite has no array type, so a JSON string
      experiences: { create: (parsed.experiences || []).map(stripNulls) },
      educations: { create: (parsed.educations || []).map(stripNulls) },
      resume: {
        create: {
          fileName: fileMeta.fileName,
          fileType: fileMeta.fileType,
          parseStatus: fileMeta.parseStatus || 'COMPLETED',
        },
      },
    },
    include: relations,
  });
}

async function getById(id) {
  const profile = await prisma.profile.findUnique({ where: { id }, include: relations });
  return profile ? withParsedSkills(profile) : null;
}

// The user edited the profile on the dashboard — only whitelisted fields are updated.
async function update(id, data) {
  const ALLOWED = ['fullName', 'email', 'phone', 'location', 'linkedin', 'website', 'summary'];
  const patch = {};
  for (const k of ALLOWED) if (k in data) patch[k] = data[k] || null;
  if ('skills' in data) {
    patch.skills = JSON.stringify(Array.isArray(data.skills) ? data.skills : []);
  }
  const profile = await prisma.profile.update({ where: { id }, data: patch, include: relations });
  return withParsedSkills(profile);
}

// MVP single-user: show the most recent profile.
async function getLatest() {
  const profile = await prisma.profile.findFirst({
    orderBy: { createdAt: 'desc' },
    include: relations,
  });
  return profile ? withParsedSkills(profile) : null;
}

async function list() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: 'desc' },
    include: relations,
  });
  return profiles.map(withParsedSkills);
}

const relations = { experiences: true, educations: true, resume: true };

// skills is a string in the DB -> return it as a JS array to callers.
function withParsedSkills(profile) {
  return { ...profile, skills: safeParse(profile.skills) };
}

function safeParse(str) {
  try {
    return JSON.parse(str || '[]');
  } catch {
    return [];
  }
}

// Clean object so `id`/null keys don't get passed to Prisma create.
function stripNulls(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (v !== null && v !== undefined) out[k] = v;
  return out;
}

module.exports = { createFromParsed, getById, getLatest, list, update };
