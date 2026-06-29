// Resume upload -> extract -> parse -> save -> return profile.
const { extractText } = require('../services/fileExtractor');
const { parseResume } = require('../services/resumeParser');
const profileModel = require('../models/profileModel');

// POST /api/resume/upload   (multipart/form-data, field name: "resume")
async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Koi file nahi mili. Field name "resume" hona chahiye.' });
    }

    // 1) File se raw text
    const rawText = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    if (!rawText || rawText.length < 20) {
      return res.status(422).json({ error: 'Resume se text nahi nikal paaya (shayad scanned image PDF hai).' });
    }

    // 2) Text -> structured profile (LLM ya heuristic)
    const { data, method } = await parseResume(rawText);

    // 3) DB me save (Profile + experiences + educations + resume doc)
    const profile = await profileModel.createFromParsed(data, {
      fileName: req.file.originalname,
      fileType: req.file.mimetype || 'unknown',
      parseStatus: 'COMPLETED',
    });

    res.status(201).json({ profile, parsedBy: method });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadResume };
