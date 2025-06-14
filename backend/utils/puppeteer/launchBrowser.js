const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const {
  LAUNCH_ARGS,
  MOBILE_DEVICES,
  DESKTOP_USER_AGENTS,
  NETWORK_CONDITIONS,
  BLOCKED_HOSTS,
} = require('./constants');
const logger = require('../logger');
const path = require('path');
const fs = require('fs');

puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

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
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: LAUNCH_ARGS,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });

      const page = await browser.newPage();
      const sessionDir = path.join(__dirname, '../../sessions', String(sessionId));
      fs.mkdirSync(sessionDir, { recursive: true });

      // ========== DEVICE/UA EMULATION ==========
      if (customDevice) {
        await page.emulate(customDevice);
        if (debug) logger.info(`Using custom device profile`);
      } else if (device && MOBILE_DEVICES[device]) {
        await page.emulate(MOBILE_DEVICES[device]);
        if (debug) logger.info(`Emulated mobile device: ${device}`);
      } else if (userAgent && DESKTOP_USER_AGENTS[userAgent]) {
        await page.setUserAgent(DESKTOP_USER_AGENTS[userAgent]);
        if (debug) logger.info(`Applied desktop user agent: ${userAgent}`);
      }

      // ========== NETWORK EMULATION ==========
      if (networkProfile && NETWORK_CONDITIONS[networkProfile]) {
        await page.emulateNetworkConditions(NETWORK_CONDITIONS[networkProfile]);
        if (debug) logger.info(`Applied network profile: ${networkProfile}`);
      }

      // ========== BLOCK REQUESTS ==========
      if (blockHosts) {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const url = req.url();
          if (BLOCKED_HOSTS.some(host => url.includes(host))) {
            if (debug) logger.info(`Blocked request: ${url}`);
            return req.abort();
          }
          return req.continue();
        });
      }

      // ========== REQUEST/RESPONSE LOGGING ==========
      const requests = [];
      page.on('requestfinished', async (req) => {
        const res = req.response();
        const entry = {
          url: req.url(),
          method: req.method(),
          status: res.status(),
          headers: await res.headers(),
        };
        requests.push(entry);
        if (debug) logger.debug(`REQ ${entry.status} ${entry.method} ${entry.url}`);
      });

      // ========== JS ERRORS ==========
      page.on('console', async (msg) => {
        const type = msg.type();
        const args = msg.args();

        const texts = await Promise.all(
          args.map(async (arg) => {
            try {
              const val = await arg.jsonValue();
              return typeof val === 'object' ? JSON.stringify(val) : String(val);
            } catch (err) {
              return '[unserializable]';
            }
          })
        );

        const fullMsg = texts.join(' | ');

        if (type === 'error') {
          logger.error(`Console error: ${fullMsg}`);
        } else {
          logger.info(`[${type}] ${fullMsg}`);
        }
      });

      page.on('pageerror', async (err) => {
        logger.error(`Page error: ${err.message}`);
        const screenshotPath = path.join(sessionDir, `error-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath });
        logger.error(`Saved screenshot: ${screenshotPath}`);
      });

      // Optional: Save request log on close
      page.on('close', () => {
        fs.writeFileSync(
          path.join(sessionDir, 'network-log.json'),
          JSON.stringify(requests, null, 2)
        );
      });

      return { browser, page, sessionDir };

    } catch (err) {
      logger.warn(`Retry ${i + 1}/${retries} failed: ${err.message}`);
      if (i === retries - 1) throw new Error(`Failed to launch browser: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

module.exports = { launchBrowserWithRetries };