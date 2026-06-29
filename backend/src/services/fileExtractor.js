// Resume file (PDF/DOCX/TXT) ka raw text nikalta hai.
// LLM ko bhejne se pehle ye step zaroori hai — LLM text padhta hai, binary nahi.

// Note: pdf-parse ko seedhe lib se require karte hain taaki uska
// debug-mode test-file bug trigger na ho.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const mammoth = require('mammoth');

/**
 * @param {Buffer} buffer  - uploaded file ka raw buffer
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

  throw new Error(`Unsupported file type: ${mimetype || originalName}. PDF, DOCX ya TXT do.`);
}

// Extra blank lines aur trailing spaces hata do — LLM ke liye saaf text.
function cleanup(text) {
  return (text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = { extractText };
