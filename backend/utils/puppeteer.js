const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function analyzeUrl(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--disable-accelerated-2d-canvas',
        '--disable-web-security', // Bypass CORS issues
      ],
      timeout: 180000, // Increase to 180s
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    const logs = [];
    const requests = [];

    const typeToLevel = { error: 'error', warning: 'warn', info: 'info', log: 'log' };

    page.on('console', (msg) => {
      logs.push({
        level: typeToLevel[msg.type()] || 'log',
        message: msg.text(),
        location: msg.location(),
      });
    });

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      requests.push({
        url: req.url(),
        method: req.method(),
        type: req.resourceType(),
        status: null,
        startTime: Date.now(),
      });
      req.continue();
    });

    page.on('response', (res) => {
      const req = requests.find((r) => r.url === res.url());
      if (req) {
        req.status = res.status();
        req.time = Date.now() - req.startTime;
      }
    });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); // 60s
    } catch (error) {
      console.error('Page navigation failed:', error.message);
    }

    return { logs, requests };
  } catch (error) {
    console.error('Puppeteer error:', error.message);
    return { logs: [], requests: [], error: error.message };
  } finally {
    if (browser) {
      await browser.close().catch((err) => console.error('Browser close error:', err.message));
    }
  }
}

module.exports = { analyzeUrl };