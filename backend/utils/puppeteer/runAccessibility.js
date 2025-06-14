// backend/utils/puppeteer/RunAccessibility.js
const { AxePuppeteer } = require('@axe-core/puppeteer');
const logger = require('../logger');

/**
 * Runs an accessibility audit using axe-core/puppeteer.
 * @param {import('puppeteer').Page} page - Puppeteer page instance.
 * @param {boolean} [debug=false] - Whether to log debug information.
 * @returns {Promise<object>} - The AXE analysis result or error.
 */
async function runAccessibility(page, debug = false) {
  try {
    const axe = new AxePuppeteer(page);
    const results = await axe.analyze();
    if (debug) logger.info('Accessibility audit completed');
    return results;
  } catch (err) {
    logger.error(`Accessibility audit failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { runAccessibility };