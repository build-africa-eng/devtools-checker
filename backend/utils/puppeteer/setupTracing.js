const { logger } = require('../logger');

async function setupTracing(page, outputDir, debug = false) {
  const traceFile = `${outputDir}/trace.json`;
  await page.tracing.start({ path: traceFile, screenshots: true });
  if (debug) logger('info', `Tracing started: ${traceFile}`);
  return async () => {
    await page.tracing.stop();
    if (debug) logger('info', `Tracing stopped: ${traceFile}`);
    return traceFile;
  };
}

module.exports = { setupTracing };