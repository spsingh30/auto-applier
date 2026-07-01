// Multer — takes the file into memory as a buffer.
// The buffer goes to the text extractor; the controller also saves it to disk in uploads/
// so that the fill phase (Puppeteer) can attach that file to the ATS form.
const multer = require('multer');

const ALLOWED = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok =
      ALLOWED.has(file.mimetype) || /\.(pdf|docx|txt)$/i.test(file.originalname);
    if (ok) cb(null, true);
    else cb(new Error('Only PDF, DOCX or TXT files are allowed.'));
  },
});

module.exports = upload;
