// Puppeteer browser launcher — fill phase ka core.
// Ek browser instance reuse hota hai (har apply pe naya launch costly hai).
// Default HEADED (headless:false) — review mode me user dekh sake form bhar raha hai.
// Headless chahiye to env: PUPPETEER_HEADLESS=true.
const puppeteer = require('puppeteer');

let browserPromise = null;

function wantHeadless() {
  return String(process.env.PUPPETEER_HEADLESS || '').toLowerCase() === 'true';
}

async function getBrowser() {
  if (browserPromise) {
    const b = await browserPromise;
    if (b.connected) return b;
    browserPromise = null; // mar gaya tha — naya launch
  }

  browserPromise = puppeteer.launch({
    headless: wantHeadless() ? 'new' : false,
    defaultViewport: { width: 1280, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  return browserPromise;
}

// Naya page (tab) banao, polite UA ke saath.
async function newPage() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
  );
  page.setDefaultTimeout(20000);
  return page;
}

async function closeBrowser() {
  if (!browserPromise) return;
  try {
    const b = await browserPromise;
    await b.close();
  } catch {
    /* ignore */
  }
  browserPromise = null;
}

module.exports = { getBrowser, newPage, closeBrowser, wantHeadless };
