// Multer — file ko memory me buffer ke roop me leta hai (disk pe save nahi).
// Buffer seedhe text-extractor ko chala jaata hai.
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
    else cb(new Error('Sirf PDF, DOCX ya TXT allowed hai.'));
  },
});

module.exports = upload;
