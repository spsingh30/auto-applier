// All profile-related DB operations live here. The controller never touches Prisma directly.
const prisma = require('../config/prisma');

// Parsed data (from services) -> create Profile + relations.
async function createFromParsed(parsed, fileMeta) {
  return prisma.profile.create({
    data: {
      fullName: parsed.fullName,
      email: parsed.email,
      phone: parsed.phone,
      location: parsed.location,
      linkedin: parsed.linkedin,
      github: parsed.github,
      website: parsed.website,
      summary: parsed.summary,
      skills: JSON.stringify(parsed.skills || []), // SQLite has no array type, so store as a JSON string
      experiences: { create: (parsed.experiences || []).map(stripNulls) },
      educations: { create: (parsed.educations || []).map(stripNulls) },
      resume: {
        create: {
          fileName: fileMeta.fileName,
          fileType: fileMeta.fileType,
          storagePath: fileMeta.storagePath || null,
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

// skills is a string in the DB -> expose it as a JS array outside.
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

// Clean object so `id`/null keys don't get passed into Prisma create.
function stripNulls(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (v !== null && v !== undefined) out[k] = v;
  return out;
}

module.exports = { createFromParsed, getById, getLatest, list, update };
