// DB layer for preferences (common application answers). Single-row (getLatest).
const prisma = require('../config/prisma');

function parse(row) {
  if (!row) return {};
  try {
    return JSON.parse(row.data || '{}');
  } catch {
    return {};
  }
}

// Latest saved answers (object). Returns {} if none exist.
async function get() {
  const row = await prisma.preferences.findFirst({ orderBy: { updatedAt: 'desc' } });
  return parse(row);
}

// Save/update answers (replaces the whole object).
async function save(data) {
  const clean = JSON.stringify(data && typeof data === 'object' ? data : {});
  const existing = await prisma.preferences.findFirst({ orderBy: { updatedAt: 'desc' } });
  if (existing) {
    await prisma.preferences.update({ where: { id: existing.id }, data: { data: clean } });
  } else {
    await prisma.preferences.create({ data: { data: clean } });
  }
  return get();
}

module.exports = { get, save };
