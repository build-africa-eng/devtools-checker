// backend/utils/puppeteer/LaunchBrowser.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const { LAUNCH_ARGS, MOBILE_DEVICES, NETWORK_CONDITIONS, BLOCKED_HOSTS } = require('./constants');
const logger = require('../logger');

// Apply plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function launchBrowserWithRetries({
  retries = 3,
  device = 'iPhone 12',
  customDevice = null,
  debug = false,
  networkProfile = null,
  blockHosts = true,
} = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: LAUNCH_ARGS,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });

      const page = await browser.newPage();

      // Emulate mobile device
      const deviceProfile = customDevice || MOBILE_DEVICES[device] || MOBILE_DEVICES['iPhone 12'];
      await page.emulate(deviceProfile);

      // Apply network throttling if requested
      if (networkProfile && NETWORK_CONDITIONS[networkProfile]) {
        await page.emulateNetworkConditions(NETWORK_CONDITIONS[networkProfile]);
        if (debug) logger.info(`Applied network profile: ${networkProfile}`);
      }

      // Block specific hostnames manually if needed
      if (blockHosts) {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const url = req.url();
          if (BLOCKED_HOSTS.some(host => url.includes(host))) {
            if (debug) logger.info(`Blocked request to: ${url}`);
            return req.abort();
          }
          return req.continue();
        });
      }

      if (debug) logger.info(`Launched browser with ${deviceProfile.name || device}`);
      return { browser, page };
    } catch (err) {
      if (debug) logger.warn(`Retrying browser launch (${i + 1}/${retries}): ${err.message}`);
      if (i === retries - 1) throw new Error(`Failed to launch browser: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

module.exports = { launchBrowserWithRetries };