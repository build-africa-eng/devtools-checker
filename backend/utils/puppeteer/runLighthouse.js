const lighthouse = require('lighthouse');
const { URL } = require('url');
const logger = require('../logger');

/**
 * Runs a Lighthouse audit against the current Puppeteer page.
 * @param {import('puppeteer').Page} page - Puppeteer page instance.
 * @param {import('puppeteer').Browser} browser - Puppeteer browser instance.
 * @param {boolean} [debug=false] - Enable verbose logging.
 * @param {object} [flags={}] - Additional Lighthouse flags.
 * @returns {Promise<object>} Result with scores, audits, or an error.
 */
async function runLighthouse(page, browser, debug = false, flags = {}) {
  try {
    if (!page || !browser) throw new Error('Invalid page or browser instance');

    const endpointURL = new URL(browser.wsEndpoint());

    const DEFAULT_TIMEOUT = 60000;

    const config = {
      port: parseInt(endpointURL.port, 10),
      output: 'json',
      logLevel: debug ? 'info' : 'error',
      timeout: flags.timeout || DEFAULT_TIMEOUT,
      ...flags, // Support overrides like onlyCategories, emulation, etc.
    };

    const url = page.url();
    if (!url || url === 'about:blank') {
      throw new Error('Cannot run Lighthouse on an invalid or blank page.');
    }

    if (debug) logger.info(`Running Lighthouse audit on ${url} with config: ${JSON.stringify(config)}`);

    const { lhr } = await lighthouse(url, config);

    if (!lhr || !lhr.categories || !lhr.audits) {
      const message = 'Lighthouse returned an incomplete report';
      logger.error(message);
      return { error: message };
    }

    if (debug) {
      logger.info(`Lighthouse audit completed for ${url}`);
      logger.info(`Scores: ${Object.entries(lhr.categories).map(
        ([cat, val]) => `${cat}: ${(val.score * 100).toFixed(0)}`
      ).join(', ')}`);
    }

    return {
      url,
      score: lhr.categories,
      audits: lhr.audits,
      timing: lhr.timing,
    };
  } catch (err) {
    logger.error(`Lighthouse audit failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { runLighthouse };