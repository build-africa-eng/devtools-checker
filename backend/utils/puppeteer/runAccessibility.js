const { AxePuppeteer } = require('@axe-core/puppeteer');
const logger = require('../logger');

async function runAccessibility(page, debug = false) {
  try {
    const axe = new AxePuppeteer(page);
    return await axe.analyze();
  } catch (err) {
    logger.error(`Accessibility audit failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { runAccessibility };