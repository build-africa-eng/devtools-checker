const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');

// Apply plugins to puppeteer
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// Optimized launch arguments for performance and stability in various environments
const launchArgs = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--single-process',
  '--disable-gpu',
];

/**
 * Analyzes a given URL using Puppeteer to collect logs, network requests, and other data.
 * @param {string} url The URL to analyze.
 * @param {object} [options] Optional settings.
 * @param {boolean} [options.includeHtml=false] Whether to include the full page HTML.
 * @param {boolean} [options.includeScreenshot=false] Whether to include a Base64-encoded screenshot.
 * @returns {Promise<object>} A promise that resolves to an object containing the analysis data.
 */
async function analyzeUrl(url, options = {}) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: launchArgs,
      timeout: 180000, // 3-minute timeout for browser launch
      protocolTimeout: 60000, // 1-minute protocol timeout
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    const page = await browser.newPage();
    await page.setBypassCSP(true);

    const logs = [];
    const requests = [];
    const requestMap = new Map();
    const MAX_LOGS = 200;
    const MAX_REQUESTS = 500;

    // --- Set up page event listeners ---
    page.on('console', (msg) => {
      if (logs.length < MAX_LOGS) {
        logs.push({
          level: msg.type(),
          message: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    await page.setRequestInterception(true);

    page.on('request', (req) => {
      const resourceType = req.resourceType();
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
          startTime: process.hrtime.bigint(),
        };
        requests.push(requestData);
        requestMap.set(req.id, requestData);
      }
      req.continue().catch(() => {});
    });

    page.on('response', async (res) => {
      const requestData = requestMap.get(res.request().id);
      if (requestData) {
        requestData.status = res.status();
        const endTime = process.hrtime.bigint();
        // Explicitly handle BigInt to avoid serialization issues
        const timeDiff = Number(endTime - requestData.startTime); // Convert BigInt difference to number
        requestData.time = timeDiff / 1e6; // Convert to milliseconds
      }
    });

    // --- Navigate and gather data ---
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    const pageTitle = await page.title();
    const html = options.includeHtml ? await page.content() : undefined;
    const screenshot = options.includeScreenshot ? await page.screenshot({ encoding: 'base64' }) : undefined;

    return {
      title: pageTitle,
      logs: logs.slice(0, MAX_LOGS),
      requests,
      html,
      screenshot,
      warning:
        logs.length >= MAX_LOGS || requests.length >= MAX_REQUESTS
          ? 'Data truncated: The page generated a high volume of logs or requests.'
          : undefined,
    };
  } catch (error) {
    let errorMessage = 'Unable to process the page. The target website may be down or blocking automated tools.';
    if (error.name === 'TimeoutError') {
      errorMessage = `Navigation Timeout: The website took too long to load or respond.`;
    }
    console.error(`Puppeteer error for ${url}:`, error.message);
    return {
      error: errorMessage,
      details: error.message,
    };
  } finally {
    if (browser) {
      await browser.close().catch((e) => console.error(`Failed to close browser: ${e.message}`));
    }
  }
}

module.exports = { analyzeUrl };