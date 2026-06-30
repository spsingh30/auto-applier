// Profile se related saari DB operations yahan. Controller seedhe Prisma ko nahi chhuta.
const prisma = require('../config/prisma');

// Parsed data (services se aaya) -> Profile + relations create karo.
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
      skills: JSON.stringify(parsed.skills || []), // SQLite me array nahi, isliye JSON string
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

// MVP single-user: sabse latest profile dikhao.
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

// skills DB me string hai -> bahar JS array bana ke do.
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

// Prisma create me `id`/null keys na jaaye isliye saaf object.
function stripNulls(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (v !== null && v !== undefined) out[k] = v;
  return out;
}

module.exports = { createFromParsed, getById, getLatest, list };
