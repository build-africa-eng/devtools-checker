// backend/utils/puppeteer/RunLighthouse.js
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
    const endpointURL = new URL(browser.wsEndpoint());
    const { lhr } = await lighthouse(page.url(), {
      port: endpointURL.port,
      output: 'json',
      logLevel: debug ? 'info' : 'error',
    });

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