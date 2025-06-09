const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');

// Plugins for stealth and ad/tracker blocking
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// Recommended stability flags for cloud/CI environments
const launchArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--single-process',
  '--disable-gpu',
  // Additional flags for even more stability
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-client-side-phishing-detection',
  '--disable-default-apps',
  '--disable-hang-monitor',
  '--disable-popup-blocking',
  '--disable-prompt-on-repost',
  '--disable-sync',
  '--metrics-recording-only',
  '--safebrowsing-disable-auto-update',
  '--enable-automation',
];

// Retry wrapper for launching browser (helpful on cold starts or flakiness)
async function launchBrowserWithRetries(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await puppeteer.launch({
        headless: 'new',
        args: launchArgs,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

// (Optional) Retry wrapper for page creation, not strictly necessary with puppeteer-extra, but can be added if desired.

async function analyzeUrl(url, options = {}) {
  let browser;
  try {
    browser = await launchBrowserWithRetries();

    const page = await browser.newPage();
    await page.setBypassCSP(true);

    const logs = [];
    const requests = [];
    const requestMap = new WeakMap();

    const MAX_LOGS = 200;
    const MAX_REQUESTS = 500;
    const onlyImportantLogs = Boolean(options.onlyImportantLogs);

    page.on('console', (msg) => {
      const level = msg.type();
      if (
        logs.length < MAX_LOGS &&
        (!onlyImportantLogs || ['error', 'warning'].includes(level))
      ) {
        logs.push({
          level,
          message: msg.text(),
          location: msg.location(),
          args: msg.args().map((arg) => arg.toString()),
          timestamp: new Date().toISOString(),
        });
      }
    });

    await page.setRequestInterception(true);

    // Block non-essential resource types and known trackers/ads by host
    const blockedHosts = [
      'doubleclick.net',
      'google-analytics.com',
      'googletagmanager.com',
      'googlesyndication.com',
      'adservice.google.com',
      'facebook.net',
      'facebook.com',
      // Add more as needed
    ];

    page.on('request', (req) => {
      const urlObj = new URL(req.url());
      const resourceType = req.resourceType();

      // Block known tracking/ad hosts early
      if (blockedHosts.some(host => urlObj.hostname.includes(host))) {
        return req.abort();
      }
      // Abort non-essential resource types
      if (['image', 'media', 'font', 'stylesheet'].includes(resourceType)) {
        return req.abort();
      }

      if (requests.length < MAX_REQUESTS) {
        const requestData = {
          url: req.url(),
          method: req.method(),
          type: resourceType,
          status: null,
          time: -1,
          errorText: null,
          startTime: process.hrtime.bigint(),
        };
        requests.push(requestData);
        requestMap.set(req, requestData);
      }

      req.continue().catch(() => {});
    });

    page.on('response', async (res) => {
      const req = res.request();
      const requestData = requestMap.get(req);
      if (requestData) {
        requestData.status = res.status();
        const endTime = process.hrtime.bigint();
        requestData.time = Number(endTime - requestData.startTime) / 1e6;
      }
    });

    page.on('requestfailed', (req) => {
      const requestData = requestMap.get(req);
      if (requestData) {
        requestData.status = 0;
        requestData.errorText = req.failure()?.errorText || 'Unknown';
        requestData.message = `Request failed: ${requestData.errorText}`;
        const endTime = process.hrtime.bigint();
        requestData.time = Number(endTime - requestData.startTime) / 1e6;
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.setViewport({ width: 1366, height: 768 });

    // Use explicit timeout for navigation
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    const pageTitle = await page.title();

    const performance = await page.evaluate(() => {
      try {
        const t = performance.timing;
        return {
          domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
          load: t.loadEventEnd - t.navigationStart,
        };
      } catch {
        return { domContentLoaded: -1, load: -1 };
      }
    });

    const html = options.includeHtml ? await page.content() : undefined;
    const screenshot = options.includeScreenshot
      ? await page.screenshot({ fullPage: true, encoding: 'base64' })
      : undefined;

    return {
      title: pageTitle,
      logs: logs.slice(0, MAX_LOGS),
      requests,
      performance,
      html,
      screenshot,
      warning:
        logs.length >= MAX_LOGS || requests.length >= MAX_REQUESTS
          ? 'Data truncated: The page generated a high volume of logs or requests.'
          : undefined,
    };
  } catch (error) {
    const isTimeout = error.name === 'TimeoutError';
    const message = isTimeout
      ? 'Navigation Timeout: The website took too long to load or respond.'
      : 'Unable to process the page. The target website may be down or blocking automated tools.';

    console.error(`Puppeteer error for ${url}:`, error.message);
    return {
      error: message,
      details: error.message,
    };
  } finally {
    if (browser) {
      await browser.close().catch((e) =>
        console.error(`Failed to close browser: ${e.message}`)
      );
    }
  }
}

module.exports = { analyzeUrl };