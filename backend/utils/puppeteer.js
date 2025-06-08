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
        '--disable-web-security',
      ],
      timeout: 180000,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();

    const logs = [];
    const requests = [];
    const MAX_LOGS = 200;
    const MAX_REQUESTS = 500;

    const typeToLevel = {
      error: 'error',
      warning: 'warn',
      info: 'info',
      log: 'log',
    };

    page.on('console', (msg) => {
      if (logs.length < MAX_LOGS) {
        logs.push({
          level: typeToLevel[msg.type()] || 'log',
          message: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    await page.setRequestInterception(true);

    page.on('request', (req) => {
      if (requests.length < MAX_REQUESTS) {
        requests.push({
          url: req.url(),
          method: req.method(),
          type: req.resourceType(),
          status: null,
          startTime: Date.now(),
        });
      }
      req.continue();
    });

    page.on('response', (res) => {
      const req = [...requests].reverse().find(
        (r) => r.url === res.url() && r.status === null
      );
      if (req) {
        req.status = res.status();
        req.time = Date.now() - req.startTime;
      }
    });

    // Set mobile user agent to improve compatibility
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
    );

    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
    } catch (error) {
      console.error('Navigation error:', error.message);
    }

    // Wait after page load to allow late logs to show
    await page.waitForTimeout(5000);

    requests.forEach((r) => {
      if (!('time' in r)) r.time = -1;
    });

    return {
      logs: logs.slice(0, MAX_LOGS),
      requests: requests.slice(0, MAX_REQUESTS),
      warning:
        logs.length >= MAX_LOGS || requests.length >= MAX_REQUESTS
          ? 'Data truncated due to high volume'
          : undefined,
    };
  } catch (error) {
    console.error('Puppeteer error:', error.message);
    return { logs: [], requests: [], error: error.message };
  } finally {
    if (browser) {
      await browser.close().catch((err) =>
        console.error('Browser close error:', err.message)
      );
    }
  }
}

module.exports = { analyzeUrl };