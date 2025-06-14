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

// Apply plugins
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
} = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: LAUNCH_ARGS,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });

      const page = await browser.newPage();

      // Determine what to emulate
      if (customDevice) {
        await page.emulate(customDevice);
        if (debug) logger.info(`Using custom device profile`);
      } else if (device && MOBILE_DEVICES[device]) {
        await page.emulate(MOBILE_DEVICES[device]);
        if (debug) logger.info(`Emulated mobile device: ${device}`);
      } else if (userAgent && DESKTOP_USER_AGENTS[userAgent]) {
        await page.setUserAgent(DESKTOP_USER_AGENTS[userAgent]);
        if (debug) logger.info(`Applied desktop user agent: ${userAgent}`);
      } else {
        if (debug) logger.warn('No valid device or userAgent specified. Default settings applied.');
      }

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

      return { browser, page };
    } catch (err) {
      if (debug) logger.warn(`Retrying browser launch (${i + 1}/${retries}): ${err.message}`);
      if (i === retries - 1) throw new Error(`Failed to launch browser: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

module.exports = { launchBrowserWithRetries };