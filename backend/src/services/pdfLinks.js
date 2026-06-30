// PDF ke hyperlink ANNOTATIONS se URLs nikaalta hai.
// Resume me LinkedIn/GitHub/Portfolio aksar clickable text/icon hote hain — unka actual URL
// extracted text me nahi, PDF ke annotation layer me hota hai. Yahi nikaalte hain.
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');

/**
 * @param {Buffer} buffer
 * @returns {Promise<string[]>} annotation URLs (mailto bhi shamil)
 */
async function extractPdfLinks(buffer) {
  const origWarn = console.warn;
  console.warn = () => {}; // pdfjs ke harmless canvas/DOMMatrix warnings dabao
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
    console.error('[pdfLinks] annotation extract fail:', e.message);
    return [];
  } finally {
    console.warn = origWarn;
  }
}

module.exports = { extractPdfLinks };
