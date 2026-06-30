// Stores the resume file on disk so that Puppeteer can later attach it to the
// form's file input (Resume/CV). Path = uploads/<profileId><ext>.
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Save the resume buffer to disk. Returns absolute path.
function saveResumeFile(profileId, buffer, originalName) {
  ensureDir();
  const ext = (path.extname(originalName || '') || '.pdf').toLowerCase();
  const filePath = path.join(UPLOAD_DIR, `${profileId}${ext}`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

// The saved resume path for this profile (if any). Otherwise null.
function getResumePath(profile) {
  if (!profile || !profile.id) return null;
  const ext = (path.extname(profile.resume?.fileName || '') || '.pdf').toLowerCase();
  const filePath = path.join(UPLOAD_DIR, `${profile.id}${ext}`);
  return fs.existsSync(filePath) ? filePath : null;
}

module.exports = { saveResumeFile, getResumePath, UPLOAD_DIR };
