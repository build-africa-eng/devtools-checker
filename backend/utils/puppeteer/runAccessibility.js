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
    // Check if page is valid
    if (!page) throw new Error('Invalid page instance');

    const axe = new AxePuppeteer(page);
    const results = await Promise.race([
      axe.analyze(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Accessibility audit timed out')), 30000)
      ),
    ]);

    if (debug) logger.info('Accessibility audit completed');
    return results;
  } catch (err) {
    logger.error(`Accessibility audit failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { runAccessibility };