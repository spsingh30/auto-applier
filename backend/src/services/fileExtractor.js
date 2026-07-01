// Extracts the raw text from a resume file (PDF/DOCX/TXT).
// This step is required before sending to the LLM — the LLM reads text, not binary.

// Note: require pdf-parse directly from its lib so that its
// debug-mode test-file bug isn't triggered.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const mammoth = require('mammoth');

/**
 * @param {Buffer} buffer  - raw buffer of the uploaded file
 * @param {string} mimetype
 * @param {string} originalName
 * @returns {Promise<string>} extracted plain text
 */
async function extractText(buffer, mimetype, originalName = '') {
  const name = originalName.toLowerCase();

  // PDF
  if (mimetype === 'application/pdf' || name.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return cleanup(data.text);
  }

  // DOCX
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return cleanup(result.value);
  }

  // Plain text
  if (mimetype === 'text/plain' || name.endsWith('.txt')) {
    return cleanup(buffer.toString('utf-8'));
  }

  throw new Error(`Unsupported file type: ${mimetype || originalName}. Please provide PDF, DOCX, or TXT.`);
}

// Remove extra blank lines and trailing spaces — clean text for the LLM.
function cleanup(text) {
  return (text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { extractText };
