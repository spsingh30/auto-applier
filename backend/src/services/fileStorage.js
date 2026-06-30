// Uploaded resume buffer ko disk pe save karta hai (uploads/ folder).
// Fill phase (Puppeteer) ko ATS form pe attach karne ke liye asli file chahiye —
// memory buffer request ke baad gayab ho jaata hai, isliye persist karna zaroori hai.
const fs = require('fs');
const path = require('path');

// backend/uploads/  (gitignored). Absolute path taaki Puppeteer ko de sakein.
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Naam safe banao + clash se bachne ke liye timestamp prefix.
function safeName(originalName) {
  const base = (originalName || 'resume').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  return `${Date.now()}_${base}`;
}

/**
 * @param {Buffer} buffer
 * @param {string} originalName
 * @returns {string} absolute path of saved file
 */
function saveResume(buffer, originalName) {
  ensureDir();
  const filePath = path.join(UPLOAD_DIR, safeName(originalName));
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

module.exports = { saveResume, UPLOAD_DIR };
