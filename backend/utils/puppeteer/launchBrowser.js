// backend/utils/puppeteer/LaunchBrowser.js

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const { LAUNCH_ARGS, MOBILE_DEVICES } = require('./constants');
const logger = require('../logger');

// ✅ Apply plugins before using puppeteer
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function launchBrowserWithRetries(retries = 3, device = 'iPhone 12', customDevice = null, debug = false) {
  for (let i = 0; i < retries; i++) {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: LAUNCH_ARGS,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, // helpful for serverless
      });

      const page = await browser.newPage();

      const deviceProfile = customDevice || MOBILE_DEVICES[device] || MOBILE_DEVICES['iPhone 12'];
      await page.emulate(deviceProfile);

      if (debug) logger.info(`Launched browser with ${deviceProfile.name || device} (stealth + adblocker)`);
      return { browser, page };
    } catch (err) {
      if (debug) logger.warn(`Retrying browser launch (${i + 1}/${retries}): ${err.message}`);
      if (i === retries - 1) throw new Error(`Failed to launch browser: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

module.exports = { launchBrowserWithRetries };