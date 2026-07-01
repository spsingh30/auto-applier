// Resume upload -> extract -> parse -> save -> return profile.
const { extractText } = require('../services/fileExtractor');
const { parseResume } = require('../services/resumeParser');
const { extractPdfLinks } = require('../services/pdfLinks');
const { saveResume } = require('../services/fileStorage');
const profileModel = require('../models/profileModel');

// POST /api/resume/upload   (multipart/form-data, field name: "resume")
async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file found. The field name must be "resume".' });
    }

    // 1) Raw text from the file
    const rawText = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!rawText || rawText.length < 20) {
      return res.status(422).json({ error: 'Could not extract text from the resume (it may be a scanned image PDF).' });
    }

    // 1.5) If it's a PDF, extract hyperlink annotations (the real LinkedIn/GitHub/Portfolio URLs).
    const isPdf = req.file.mimetype === 'application/pdf' || /\.pdf$/i.test(req.file.originalname);
    const pdfUrls = isPdf ? await extractPdfLinks(req.file.buffer).catch(() => []) : [];

    // 2) Text -> structured profile (LLM or heuristic) + links backfill
    const { data, method } = await parseResume(rawText, pdfUrls);

    // 2.5) Save the original file to disk — the fill phase (Puppeteer) will attach it to the ATS form.
    let storagePath = null;
    try {
      storagePath = saveResume(req.file.buffer, req.file.originalname);
    } catch (e) {
      console.error('[resume] file could not be saved to disk:', e.message); // parsing will still proceed
    }

    // 3) Save to the DB (Profile + experiences + educations + resume doc)
    const profile = await profileModel.createFromParsed(data, {
      fileName: req.file.originalname,
      fileType: req.file.mimetype || 'unknown',
      storagePath,
      parseStatus: 'COMPLETED',
    });

    res.status(201).json({ profile, parsedBy: method });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadResume };
