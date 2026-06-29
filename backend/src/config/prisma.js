// Ek hi PrismaClient instance puri app me share hota hai (best practice).
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
