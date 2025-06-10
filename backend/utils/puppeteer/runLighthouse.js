const lighthouse = require('lighthouse');
const { URL } = require('url');
const { logger } = require('../logger');

async function runLighthouse(page, browser, debug = false) {
  try {
    const { lhr } = await lighthouse(page.url(), {
      port: new URL(browser.wsEndpoint()).port,
      output: 'json',
      logLevel: debug ? 'verbose' : 'error',
    });
    return { score: lhr.categories, audits: lhr.audits };
  } catch (err) {
    logger('error', `Lighthouse failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { runLighthouse };