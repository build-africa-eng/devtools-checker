const puppeteer = require('puppeteer');

async function analyzeUrl(url) {
  try {
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

    const isImportantConsole = (msg) => {
      const text = msg.text().toLowerCase();

      // Filter out known noisy WebGL warnings
      const ignorePatterns = [
        'automatic fallback to software webgl has been deprecated',
        'gpu stall due to readpixels',
        'groupmarkernotset',
      ];

      const isNoise = ignorePatterns.some((pattern) => text.includes(pattern));
      const isError = msg.type() === 'error';
      const isImportantWarn = msg.type() === 'warning' && !isNoise;

      return isError || isImportantWarn;
    };

    page.on('console', (msg) => {
      const entry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        important: isImportantConsole(msg),
      };
      logs.push(entry);
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

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await browser.close();

    return { logs, requests };
  } catch (error) {
    console.error('Puppeteer error:', error.message, error.stack);
    throw new Error(`Analysis failed: ${error.message}`);
  }
}

module.exports = { analyzeUrl };