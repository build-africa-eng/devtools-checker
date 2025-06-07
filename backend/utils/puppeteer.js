const puppeteer = require('puppeteer');

async function analyzeUrl(url) {
  try {
    console.log('Launching Puppeteer for URL:', url);
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: process.env.NODE_ENV === 'production' ? '/usr/bin/chromium' : null,
      timeout: 60000, // Increased timeout to 60s
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
    throw new Error('Analysis failed: ' + error.message);
  }
}

module.exports = { analyzeUrl };