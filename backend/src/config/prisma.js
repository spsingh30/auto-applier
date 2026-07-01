// A single PrismaClient instance is shared across the whole app (best practice).
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
