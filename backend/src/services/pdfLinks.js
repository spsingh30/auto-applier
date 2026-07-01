// Extracts URLs from the PDF's hyperlink ANNOTATIONS.
// In a resume, LinkedIn/GitHub/Portfolio are often clickable text/icons — their actual URL
// isn't in the extracted text but in the PDF's annotation layer. That's what we pull out here.
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

/**
 * @param {Buffer} buffer
 * @returns {Promise<string[]>} annotation URLs (mailto included)
 */
async function extractPdfLinks(buffer) {
  const origWarn = console.warn;
  console.warn = () => {}; // suppress pdfjs's harmless canvas/DOMMatrix warnings
  try {
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0,
    }).promise;

    const urls = new Set();
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const anns = await page.getAnnotations().catch(() => []);
      for (const a of anns) {
        const u = a.url || a.unsafeUrl;
        if (u) urls.add(u);
      }
    }
    await doc.destroy().catch(() => {});
    return [...urls];
  } catch (e) {
    console.error('[pdfLinks] annotation extraction failed:', e.message);
    return [];
  } finally {
    console.warn = origWarn;
  }
}

module.exports = { extractPdfLinks };
