const { logger } = require('./logger');
const path = require('path');

async function setupTracing(page, outputDir, debug = false) {
  const traceFile = path.join(outputDir, 'trace.json');
  try {
    await page.tracing.start({ path: traceFile, screenshots: true });
    if (debug) logger('info', `Tracing started: ${traceFile}`);
  } catch (err) {
    if (debug) logger('error', `Failed to start tracing: ${err.message}`);
    throw err;
  }

  return async () => {
    try {
      await page.tracing.stop();
      if (debug) logger('info', `Tracing stopped: ${traceFile}`);
      return traceFile;
    } catch (err) {
      if (debug) logger('error', `Failed to stop tracing: ${err.message}`);
      throw err;
    }
  };
}

module.exports = { setupTracing };