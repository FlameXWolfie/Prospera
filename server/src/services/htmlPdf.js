// Render a self-contained résumé HTML document (built client-side from the SAME
// templates the editor shows — see src/components/resume/printDoc.js) to a
// print-perfect A4 PDF via headless Chrome. The PDF therefore matches the
// on-screen preview exactly, with real clickable links and clean pagination.
//
// SECURITY: the posted HTML is rendered with JavaScript DISABLED and behind a
// request allowlist that permits ONLY `data:` URIs and Google Fonts — every other
// network/file request is aborted. So untrusted résumé content cannot run scripts,
// reach internal URLs (SSRF), or read local files.
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

// Chrome/Chromium location: CHROME_PATH env wins, else common install paths. When
// none is found the controller returns 503 and the client falls back to print.
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
].filter(Boolean);

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    try { if (existsSync(p)) return p; } catch { /* ignore */ }
  }
  return null;
}

const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

const isAlive = (b) => {
  try { return typeof b.connected === 'boolean' ? b.connected : b.isConnected(); }
  catch { return false; }
};

// Reuse a single browser across requests (launch is the slow part); relaunch if it
// died or disconnected.
let browserPromise = null;
async function getBrowser() {
  if (browserPromise) {
    const existing = await browserPromise.catch(() => null);
    if (existing && isAlive(existing)) return existing;
    browserPromise = null;
  }
  const executablePath = findChrome();
  if (!executablePath) {
    const err = new Error('No Chrome/Chromium executable found (set CHROME_PATH).');
    err.code = 'ENOENT';
    throw err;
  }
  browserPromise = puppeteer
    .launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    })
    .catch((err) => { browserPromise = null; throw err; });
  return browserPromise;
}

export async function htmlToPdf(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const url = req.url();
      if (url.startsWith('data:')) { req.continue(); return; }
      let host = '';
      try { host = new URL(url).hostname; } catch { /* relative / blank */ }
      if (FONT_HOSTS.has(host)) { req.continue(); return; }
      req.abort();
    });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    // page.pdf() returns a Uint8Array; wrap as a Node Buffer so Express streams it
    // as binary (res.send on a bare Uint8Array would JSON-serialize it).
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}
