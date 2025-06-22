const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const { LAUNCH_ARGS, MOBILE_DEVICES, DESKTOP_USER_AGENTS, BLOCKED_HOSTS } = require('./constants');
const logger = require('../logger');
const path = require('path');
const fs = require('fs');
const { processConsoleArg, formatAndLogMessage } = require('./enhancedLogging');

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function launchBrowserWithRetries({
  retries = 3,
  device = null,
  userAgent = null,
  customDevice = null,
  debug = false,
  blockHosts = true,
  sessionId = Date.now(),
  captureAssetBodies = false,
} = {}) {
  let sessionDir;
  for (let i = 0; i < retries; i++) {
    let browser;
    try {
      const startTime = Date.now();
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          ...LAUNCH_ARGS,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-network',
          '--disable-gpu',
        ],
        ignoreHTTPSErrors: true,
        timeout: 120000,
        protocolTimeout: 600000,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });
      const endTime = Date.now();
      debug && logger.info(`Browser launched in ${((endTime - startTime) / 1000).toFixed(2)}s`);

      const page = await browser.newPage();
      sessionDir = path.join(__dirname, '../../sessions', String(sessionId));
      fs.mkdirSync(sessionDir, { recursive: true });

      const collectedConsoleLogs = [];
      const collectedRequests = [];

      await page.setViewport({ width: 1280, height: 800 });

      if (customDevice) {
        await page.emulate(customDevice);
        debug && logger.info('Using custom device profile');
      } else if (device && MOBILE_DEVICES[device]) {
        await page.emulate(MOBILE_DEVICES[device]);
        debug && logger.info(`Emulated mobile device: ${device}`);
      } else if (userAgent && DESKTOP_USER_AGENTS[userAgent]) {
        await page.setUserAgent(DESKTOP_USER_AGENTS[userAgent]);
        await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
        debug && logger.info(`Applied desktop user agent: ${userAgent}`);
      }

      debug && logger.info('Network monitoring and emulation disabled to avoid timeouts');

      if (blockHosts) {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const url = req.url();
          if (BLOCKED_HOSTS.some(host => url.includes(host))) {
            debug && logger.info(`Blocked request: ${url}`);
            return req.abort();
          }
          return req.continue();
        });
      }

      // ✅ Capture request completions (with asset type info)
      page.on('requestfinished', async (req) => {
        const res = req.response();
        if (!res) return;

        const entry = {
          url: req.url(),
          method: req.method(),
          status: res.status(),
          headers: res.headers(),
          resourceType: req.resourceType(),
          fromCache: res.fromCache(),
          fromServiceWorker: res.fromServiceWorker(),
        };
        collectedRequests.push(entry);
        debug && logger.debug(`[${entry.resourceType.toUpperCase()}] ${entry.status} ${entry.method} ${entry.url}`);
      });

      // ❌ Capture failed asset loads
      page.on('requestfailed', (req) => {
        const failure = req.failure();
        collectedRequests.push({
          url: req.url(),
          method: req.method(),
          status: 'FAILED',
          errorText: failure?.errorText || 'unknown',
          resourceType: req.resourceType(),
        });
        debug && logger.warn(`❌ Failed request (${req.resourceType()}): ${req.url()} - ${failure?.errorText}`);
      });

      // 📦 Optional: capture asset body content (JS/CSS only)
      page.on('response', async (res) => {
        const req = res.request();
        const type = req.resourceType();
        if (!captureAssetBodies) return;
        if (['script', 'stylesheet'].includes(type)) {
          try {
            const content = await res.text();
            const ext = type === 'script' ? 'js' : 'css';
            const safeName = req.url().replace(/[^a-z0-9]/gi, '_').slice(0, 100);
            const filePath = path.join(sessionDir, `${safeName}.${ext}`);
            fs.writeFileSync(filePath, content);
            debug && logger.info(`Saved ${type} body: ${filePath}`);
          } catch (e) {
            logger.warn(`Failed to save asset body: ${req.url()} - ${e.message}`);
          }
        }
      });

      // 🧠 Capture console logs with source file
      page.on('console', async (msg) => {
        const location = msg.location();
        const entry = {
          type: msg.type(),
          text: msg.text(),
          timestamp: Date.now(),
          args: [],
          url: location?.url || '',
          lineNumber: location?.lineNumber || -1,
          columnNumber: location?.columnNumber || -1,
          sourceFile: location?.url || 'unknown',
        };

        try {
          entry.args = await Promise.all(msg.args().map(arg => processConsoleArg(arg, debug)));
          collectedConsoleLogs.push(entry);
          debug && formatAndLogMessage(entry, debug);
        } catch (err) {
          logger.warn(`Console processing error: ${err.message}`);
          entry.args = [`Error: ${err.message}`];
          collectedConsoleLogs.push(entry);
        }
      });

      page.on('pageerror', async (err) => {
        logger.error(`Page error: ${err.message}`);
        collectedConsoleLogs.push({
          type: 'error',
          text: `Page Error: ${err.message}`,
          timestamp: Date.now(),
          args: [{ error: err.message, stack: err.stack }],
        });
        try {
          if (!page.isClosed()) {
            await page.screenshot({ path: path.join(sessionDir, `pageerror-${Date.now()}.png`), fullPage: true });
          }
        } catch {}
      });

      page.on('error', async (err) => {
        logger.error(`Puppeteer error: ${err.message}`);
        collectedConsoleLogs.push({
          type: 'error',
          text: `Unhandled Error: ${err.message}`,
          timestamp: Date.now(),
          args: [{ error: err.message, stack: err.stack }],
        });
        try {
          if (!page.isClosed()) {
            await page.screenshot({ path: path.join(sessionDir, `unhandled-${Date.now()}.png`), fullPage: true });
          }
        } catch {}
      });

      page.on('close', () => {
        try {
          fs.writeFileSync(path.join(sessionDir, 'network-log.json'), JSON.stringify(collectedRequests, null, 2));
          fs.writeFileSync(path.join(sessionDir, 'console-log.json'), JSON.stringify(collectedConsoleLogs, null, 2));
        } catch (e) {
          logger.error(`Failed to write logs: ${e.message}`);
        }
      });

      return { browser, page, sessionDir, collectedConsoleLogs, collectedRequests };
    } catch (err) {
      logger.warn(`Retry ${i + 1}/${retries} failed: ${err.message}`);
      if (browser) await browser.close();
      if (i === retries - 1) {
        const elapsedTime = Date.now() - (startTime || Date.now());
        logger.warn(`Total time for ${retries} attempts: ${elapsedTime / 1000}s`);
        debug && logger.warn('Proceeding without browser instance due to repeated failures.');
        return { browser: null, page: null, sessionDir, collectedConsoleLogs: [], collectedRequests: [] };
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

module.exports = { launchBrowserWithRetries };
