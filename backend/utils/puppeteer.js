const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function analyzeUrl(url) {
  const cacheDir = path.join('/tmp', '.cache', 'puppeteer'); // Use /tmp as a writable directory on Render
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  process.env.PUPPETEER_CACHE_DIR = cacheDir;

  try {
    console.log('Launching Puppeteer for URL:', url);
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
      timeout: 60000,
      // Ensure Puppeteer downloads Chromium if not present
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
    const page = await browser.newPage();
    const logs = [];
    const requests = [];

    page.on('console', (msg) => {
      console.log('Console log:', msg.text());
      logs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      });
    });

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      requests.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        status: null,
      });
      req.continue();
    });
    page.on('response', (res) => {
      const req = requests.find((r) => r.url === res.url());
      if (req) req.status = res.status();
    });

    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await browser.close();
    console.log('Analysis completed:', { logsLength: logs.length, requestsLength: requests.length });
    return { logs, requests };
  } catch (error) {
    console.error('Puppeteer error:', error.message, error.stack);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

module.exports = { analyzeUrl };