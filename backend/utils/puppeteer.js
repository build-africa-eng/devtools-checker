const puppeteer = require('puppeteer');

async function analyzeUrl(url) {
  try {
    console.log('Launching Puppeteer for URL:', url);
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
      ],
      timeout: 60000,
    });

    const page = await browser.newPage();
    const logs = [];
    const requests = [];

    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      const isImportant =
        type === 'error' &&
        !text.includes('favicon.ico') &&
        !text.includes('Failed to load resource: net::ERR_UNKNOWN_URL_SCHEME');

      logs.push({
        type,
        text,
        location: msg.location(),
        important: isImportant,
      });
    });

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      requests.push({
        url: req.url(),
        method: req.method(),
        resourceType: req.resourceType(),
        status: null,
        important: false, // default
      });
      req.continue();
    });

    page.on('response', (res) => {
      const url = res.url();
      const req = requests.find((r) => r.url === url);
      if (req) {
        const status = res.status();
        req.status = status;
        req.important = status >= 400 && !url.includes('favicon.ico');
      }
    });

    console.log('Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await browser.close();

    console.log('Analysis completed:', {
      logsLength: logs.length,
      requestsLength: requests.length,
    });

    return { logs, requests };
  } catch (error) {
    console.error('Puppeteer error:', error.message, error.stack);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

module.exports = { analyzeUrl };