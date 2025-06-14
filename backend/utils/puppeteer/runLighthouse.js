const lighthouse = require('lighthouse');
const { URL } = require('url');
const logger = require('../logger');

/**
 * Runs a Lighthouse audit against the current page.
 * @param {import('puppeteer').Page} page - Puppeteer page instance.
 * @param {import('puppeteer').Browser} browser - Puppeteer browser instance.
 * @param {boolean} [debug=false] - Whether to log debug output.
 * @returns {Promise<object>} Lighthouse categories and audits, or error.
 */
async function runLighthouse(page, browser, debug = false) {
  try {
    // Check if page and browser are valid
    if (!page || !browser) throw new Error('Invalid page or browser instance');

    const endpointURL = new URL(browser.wsEndpoint());
    const { lhr } = await Promise.race([
      lighthouse(page.url(), {
        port: endpointURL.port,
        output: 'json',
        logLevel: debug ? 'info' : 'error',
        timeout: 30000, // Add timeout to prevent hanging
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Lighthouse audit timed out')), 30000)
      ),
    ]);

    if (debug) logger.info('Lighthouse audit completed');
    return {
      score: lhr.categories,
      audits: lhr.audits,
    };
  } catch (err) {
    logger.error(`Lighthouse audit failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { runLighthouse };