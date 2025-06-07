const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function analyzeUrl(url) {
  const cacheDir = path.join('/tmp', '.cache', 'ms-playwright'); // Use /tmp as a writable directory
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  process.env.PLAYWRIGHT_BROWSERS_PATH = cacheDir; // Set custom cache path

  try {
    console.log('Launching Playwright for URL:', url);
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process'],
      timeout: 60000,
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

    await page.route('**/*', (route) => {
      requests.push({
        url: route.request().url(),
        method: route.request().method(),
        resourceType: route.request().resourceType(),
        status: null,
      });
      route.continue();
    });

    await page.route('**/*', async (route) => {
      const response = await route.fetch();
      const req = requests.find((r) => r.url === response.url());
      if (req) req.status = response.status();
      route.fulfill({ response });
    });

    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await browser.close();
    console.log('Analysis completed:', { logsLength: logs.length, requestsLength: requests.length });
    return { logs, requests };
  } catch (error) {
    console.error('Playwright error:', error.message, error.stack);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

module.exports = { analyzeUrl };