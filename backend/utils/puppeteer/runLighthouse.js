const lighthouse = require('lighthouse');
const { URL } = require('url');
const logger = require('../logger');
const path = require('path');
const fs = require('fs');
const { saveCombinedReport } = require('../saveCombinedReport');

/**
 * Runs a Lighthouse audit using Puppeteer browser + page.
 * @param {import('puppeteer').Page} page
 * @param {import('puppeteer').Browser} browser
 * @param {boolean} [debug=false]
 * @param {object} [flags={}]
 * @returns {Promise<object>} Lighthouse scores, audits, screenshot, or error.
 */
async function runLighthouse(page, browser, debug = false, flags = {}) {
  try {
    if (!page || !browser) throw new Error('Invalid page or browser instance');

    const endpointURL = new URL(browser.wsEndpoint());
    const DEFAULT_TIMEOUT = 300000;

    const config = {
      port: parseInt(endpointURL.port, 10),
      output: 'json',
      logLevel: debug ? 'info' : 'error',
      timeout: flags.timeout || DEFAULT_TIMEOUT,
      ...flags,
    };

    const url = page.url();
    if (!url || url === 'about:blank') {
      throw new Error('Cannot run Lighthouse on an invalid or blank page.');
    }

    if (debug) logger.info(`Running Lighthouse audit on ${url}`);

    const { lhr } = await lighthouse(url, config);

    if (!lhr?.categories || !lhr.audits) {
      throw new Error('Lighthouse returned an incomplete report');
    }

    const result = {
      url,
      score: lhr.categories,
      audits: lhr.audits,
      timing: lhr.timing,
    };

    // Save screenshot and HTML if outputDir given
    if (flags.outputDir) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const jsonPath = path.join(flags.outputDir, `lighthouse-results-${timestamp}.json`);
      const screenshotPath = path.join(flags.outputDir, `lighthouse-screenshot-${timestamp}.png`);

      fs.writeFileSync(jsonPath, JSON.stringify(lhr, null, 2), 'utf-8');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const htmlPath = saveCombinedReport({
        title: 'Lighthouse',
        outputDir: flags.outputDir,
        data: result,
        screenshotPath
      });

      if (debug) {
        logger.info(`Lighthouse JSON saved to ${jsonPath}`);
        logger.info(`Screenshot saved to ${screenshotPath}`);
        logger.info(`Combined HTML report saved to ${htmlPath}`);
      }
    }

    return result;
  } catch (err) {
    logger.error(`Lighthouse audit failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { runLighthouse };