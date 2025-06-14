const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const {
  LAUNCH_ARGS,
  MOBILE_DEVICES,
  DESKTOP_USER_AGENTS,
  NETWORK_CONDITIONS,
  BLOCKED_HOSTS,
} = require('./constants'); // Assuming constants are in a separate file
const logger = require('../logger'); // Assuming a logger utility exists
const path = require('path');
const fs = require('fs');

// Apply Puppeteer plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

/**
 * Launches a Puppeteer browser with retry logic and enhanced configuration.
 * @param {object} options - The launch options.
 * @param {number} [options.retries=3] - The number of times to retry launching the browser.
 * @param {string|null} [options.device=null] - The name of a mobile device to emulate from MOBILE_DEVICES.
 * @param {string|null} [options.userAgent=null] - The name of a desktop user agent to apply from DESKTOP_USER_AGENTS.
 * @param {object|null} [options.customDevice=null] - A custom Puppeteer device descriptor to emulate.
 * @param {boolean} [options.debug=false] - Whether to enable detailed logging.
 * @param {string|null} [options.networkProfile=null] - A network condition profile to emulate.
 * @param {boolean} [options.blockHosts=true] - Whether to block requests to known tracking/ad hosts.
 * @param {string|number} [options.sessionId=Date.now()] - A unique ID for the session to store logs and screenshots.
 * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page, sessionDir: string}>}
 */
async function launchBrowserWithRetries({
  retries = 3,
  device = null,
  userAgent = null,
  customDevice = null,
  debug = false,
  networkProfile = null,
  blockHosts = true,
  sessionId = Date.now(),
} = {}) {
  for (let i = 0; i < retries; i++) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: LAUNCH_ARGS,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });

      const page = await browser.newPage();
      const sessionDir = path.join(__dirname, '../../sessions', String(sessionId));
      fs.mkdirSync(sessionDir, { recursive: true });
      
      // ========== SET VIEWPORT (FIX) ==========
      // Set a default viewport to prevent "0 width" screenshot errors
      await page.setViewport({ width: 1280, height: 800 });


      // ========== DEVICE/UA EMULATION ==========
      if (customDevice) {
        await page.emulate(customDevice);
        debug && logger.info(`Using custom device profile`);
      } else if (device && MOBILE_DEVICES[device]) {
        await page.emulate(MOBILE_DEVICES[device]);
        debug && logger.info(`Emulated mobile device: ${device}`);
      } else if (userAgent && DESKTOP_USER_AGENTS[userAgent]) {
        await page.setUserAgent(DESKTOP_USER_AGENTS[userAgent]);
        debug && logger.info(`Applied desktop user agent: ${userAgent}`);
      }

      // ========== NETWORK EMULATION ==========
      if (networkProfile && NETWORK_CONDITIONS[networkProfile]) {
        await page.emulateNetworkConditions(NETWORK_CONDITIONS[networkProfile]);
        debug && logger.info(`Applied network profile: ${networkProfile}`);
      }

      // ========== BLOCK REQUESTS ==========
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

      // ========== REQUEST/RESPONSE LOGGING ==========
      const requests = [];
      page.on('requestfinished', async (req) => {
        const res = req.response();
        // Guard against null responses, which can happen for aborted requests, etc.
        if (!res) return;
        const entry = {
          url: req.url(),
          method: req.method(),
          status: res.status(),
          headers: res.headers(),
        };
        requests.push(entry);
        debug && logger.debug(`REQ ${entry.status} ${entry.method} ${entry.url}`);
      });

      // ========== JS CONSOLE LOGGING (FIXED) ==========
      page.on('console', async (msg) => {
        const type = msg.type();
        try {
          const args = await Promise.all(msg.args().map(arg => arg.jsonValue()));
          // FIX: Renamed full-Msg to fullMsg (removed hyphen)
          let fullMsg = ''; 
          for (const arg of args) {
            if (typeof arg === 'object' && arg !== null) {
              // Stringify objects/errors to get a meaningful message
              fullMsg += JSON.stringify(arg, Object.getOwnPropertyNames(arg)) + ' ';
            } else {
              fullMsg += arg + ' ';
            }
          }

          if (type === 'error') {
            logger.error(`Console error: ${fullMsg.trim()}`);
          } else {
            logger.info(`[${type}] ${fullMsg.trim()}`);
          }
        } catch (err) {
          logger.warn(`Failed to serialize console message: ${err.message}`);
          logger.warn(`Raw console message text: ${msg.text()}`);
        }
      });

      // ========== PAGE ERROR HANDLING (UPDATED) ==========
      // Handles errors thrown within the page's context (e.g., window.onerror)
      page.on('pageerror', async (err) => {
        logger.error(`Page error: ${err.message}`);
        const screenshotPath = path.join(sessionDir, `pageerror-${Date.now()}.png`);
        try {
          if (!page.isClosed()) {
            await page.screenshot({ path: screenshotPath, fullPage: true });
            logger.error(`Saved full page screenshot: ${screenshotPath}`);
          } else {
            logger.warn('Cannot capture screenshot on pageerror, page already closed.');
          }
        } catch (screenshotErr) {
          logger.error(`Screenshot failed on pageerror: ${screenshotErr.message}`);
        }
      });

      // ========== UNCAUGHT EXCEPTION HANDLING (NEW) ==========
      // Catches uncaught exceptions from the page (different from pageerror)
      page.on('error', async (err) => {
          logger.error(`Unhandled exception in page: ${err.message}`);
          const screenshotPath = path.join(sessionDir, `uncaught-exception-${Date.now()}.png`);
          try {
              if (!page.isClosed()) {
                  await page.screenshot({ path: screenshotPath, fullPage: true });
                  logger.error(`Saved full page screenshot: ${screenshotPath}`);
              } else {
                  logger.warn('Cannot capture screenshot on uncaught exception, page already closed.');
              }
          } catch (screenshotErr) {
              logger.error(`Screenshot failed on uncaught exception: ${screenshotErr.message}`);
          }
      });


      // ========== SAVE LOGS ON CLOSE ==========
      page.on('close', () => {
        try {
          fs.writeFileSync(
            path.join(sessionDir, 'network-log.json'),
            JSON.stringify(requests, null, 2)
          );
        } catch (writeErr) {
          logger.error(`Failed to write network-log: ${writeErr.message}`);
        }
      });

      return { browser, page, sessionDir };

    } catch (err) {
      logger.warn(`Launch attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (browser) await browser.close(); // Ensure browser is closed on failure
      if (i === retries - 1) throw new Error(`Failed to launch browser after ${retries} attempts: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

module.exports = { launchBrowserWithRetries };
