const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// A more streamlined set of launch args for general use.
// Your original args are kept below in case they are needed for a specific environment.
const launchArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--single-process', // This can be useful in containers
  '--disable-gpu',
];

/**
 * Analyzes a given URL using Puppeteer to collect logs, network requests, and other data.
 * @param {string} url The URL to analyze.
 * @param {object} [options] Optional settings.
 * @param {boolean} [options.includeHtml=false] Whether to include the full page HTML.
 * @param {boolean} [options.includeScreenshot=false] Whether to include a Base64-encoded screenshot.
 * @returns {Promise<object>} A promise that resolves to the analysis data.
 */
async function analyzeUrl(url, options = {}) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: launchArgs,
      timeout: 180000,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.setBypassCSP(true);

    const logs = [];
    const requests = [];
    const MAX_LOGS = 200;
    const MAX_REQUESTS = 500;

    page.on('console', (msg) => {
      if (logs.length < MAX_LOGS) {
        try {
          logs.push({
            level: msg.type(),
            message: msg.text(),
            location: msg.location(),
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          // In case the message is not serializable
        }
      }
    });

    await page.setRequestInterception(true);

    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'media', 'font'].includes(resourceType)) {
        return req.abort(); // Abort more resource types to speed up
      }
      if (requests.length < MAX_REQUESTS) {
        requests.push({
          url: req.url(),
          method: req.method(),
          type: resourceType,
          status: null,
          startTime: process.hrtime.bigint(), // Use high-resolution time
        });
      }
      req.continue().catch(() => {});
    });

    page.on('response', (res) => {
      const match = [...requests].reverse().find((r) => r.url === res.url() && r.status === null);
      if (match) {
        match.status = res.status();
        const endTime = process.hrtime.bigint();
        match.time = Number(endTime - match.startTime) / 1e6; // a more precise duration in ms
      }
    });
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    
    // --- New Data Collection ---
    const pageTitle = await page.title();
    const html = options.includeHtml ? await page.content() : undefined;
    const screenshot = options.includeScreenshot ? await page.screenshot({ encoding: 'base64' }) : undefined;

    // Mark any requests that never completed
    requests.forEach((r) => {
      if (r.status === null) r.time = -1; // Timed out or blocked
    });

    return {
      title: pageTitle,
      logs: logs.slice(0, MAX_LOGS),
      requests: requests.slice(0, MAX_REQUESTS),
      html,
      screenshot,
      warning:
        logs.length >= MAX_LOGS || requests.length >= MAX_REQUESTS
          ? 'Data truncated due to high volume'
          : undefined,
    };
  } catch (error) {
    console.error(`Puppeteer error for ${url}:`, error.message);
    let errorMessage = 'Unable to process the page.';
    if (error.name === 'TimeoutError') {
      errorMessage = `Navigation timeout: The page took too long to load.`;
    }
    return {
      error: errorMessage,
      details: error.message,
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

module.exports = { analyzeUrl };