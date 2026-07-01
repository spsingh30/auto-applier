// Saves the uploaded resume buffer to disk (the uploads/ folder).
// The fill phase (Puppeteer) needs a real file to attach to the ATS form —
// the in-memory buffer disappears after the request, so persisting it is necessary.
const fs = require('fs');
const path = require('path');

// backend/uploads/  (gitignored). Absolute path so we can pass it to Puppeteer.
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Make the name safe + add a timestamp prefix to avoid clashes.
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
