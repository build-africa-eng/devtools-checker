const logger = require('../logger');
const path = require('path');

async function setupTracing(page, outputDir, debug = false) {
  const traceFile = path.join(outputDir, 'trace.json');
  try {
    // Validate page instance
    if (!page) throw new Error('Invalid page instance');

    await Promise.race([
      page.tracing.start({ path: traceFile, screenshots: true }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tracing start timed out')), 30000)
      ),
    ]);
    if (debug) logger.info(`Tracing started: ${traceFile}`);
  } catch (err) {
    if (debug) logger.error(`Failed to start tracing: ${err.message}`);
    throw err;
  }

  return async () => {
    try {
      await Promise.race([
        page.tracing.stop(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tracing stop timed out')), 30000)
        ),
      ]);
      if (debug) logger.info(`Tracing stopped: ${traceFile}`);
      return traceFile;
    } catch (err) {
      if (debug) logger.error(`Failed to stop tracing: ${err.message}`);
      throw err;
    }
  };
}

module.exports = { setupTracing };