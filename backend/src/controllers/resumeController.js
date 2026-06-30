// Resume upload -> extract -> parse -> save -> return profile.
const { extractText } = require('../services/fileExtractor');
const { parseResume } = require('../services/resumeParser');
const { saveResumeFile } = require('../services/resumeStore');
const profileModel = require('../models/profileModel');

// POST /api/resume/upload   (multipart/form-data, field name: "resume")
async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file received. The field name must be "resume".' });
    }

    // 1) Raw text from the file
    const rawText = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!rawText || rawText.length < 20) {
      return res.status(422).json({ error: 'Could not extract text from the resume (it may be a scanned image PDF).' });
    }

    // 2) Text -> structured profile (LLM or heuristic)
    const { data, method } = await parseResume(rawText);

    // 3) Save to DB (Profile + experiences + educations + resume doc)
    const profile = await profileModel.createFromParsed(data, {
      fileName: req.file.originalname,
      fileType: req.file.mimetype || 'unknown',
      parseStatus: 'COMPLETED',
    });

    // 4) Save the original file to disk — later attached to the autofill "Resume/CV" field.
    try {
      saveResumeFile(profile.id, req.file.buffer, req.file.originalname);
    } catch (e) {
      console.error('[resume] file disk save fail:', e.message);
    }

    res.status(201).json({ profile, parsedBy: method });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadResume };
