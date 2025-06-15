const fs = require('fs'); const path = require('path'); const { promisify } = require('util'); const logger = require('../logger');

const mkdir = promisify(fs.mkdir); const stat = promisify(fs.stat);

/**

Parses a Chrome trace file and returns summary metadata.

@param {string} tracePath - Path to the trace.json file.

@returns {Promise<object>} Summary of the trace. */ async function parseTrace(tracePath) { const rawData = await fs.promises.readFile(tracePath, 'utf-8'); const trace = JSON.parse(rawData);


const events = trace.traceEvents || []; const eventTypes = new Set(); let minTs = Infinity; let maxTs = -Infinity; let screenshotCount = 0;

for (const e of events) { if (e.ts != null) { minTs = Math.min(minTs, e.ts); maxTs = Math.max(maxTs, e.ts); } if (e.name) { eventTypes.add(e.name); if (e.name === 'Screenshot') screenshotCount++; } }

return { totalEvents: events.length, uniqueEventTypes: [...eventTypes], screenshotCount, startTime: minTs, endTime: maxTs, durationMs: (maxTs - minTs) / 10000, }; }

/**

Starts Chrome tracing on a Puppeteer page and returns a stop function that summarizes it.

@param {import('puppeteer').Page} page - Puppeteer page instance.

@param {string} outputDir - Directory to store trace.json.

@param {boolean} debug - Whether to log debug info.

@returns {() => Promise<{tracePath: string, summary: object}>} */ async function setupTracing(page, outputDir, debug = false) { const tracePath = path.join(outputDir, 'trace.json');


try { if (!page) throw new Error('Invalid Puppeteer page instance'); await mkdir(outputDir, { recursive: true });

await Promise.race([
  page.tracing.start({
    path: tracePath,
    screenshots: true,
    categories: [
      'devtools.timeline',
      'disabled-by-default-devtools.timeline',
      'toplevel',
      'v8',
      'blink.console',
      'loading',
      'disabled-by-default-v8.cpu_profiler',
    ],
  }),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Tracing start timed out')), 60000)
  ),
]);

if (debug) logger.info(`Tracing started: ${tracePath}`);

} catch (err) { logger.error(Tracing start failed: ${err.message}); throw err; }

return async () => { try { await Promise.race([ page.tracing.stop(), new Promise((_, reject) => setTimeout(() => reject(new Error('Tracing stop timed out')), 60000) ), ]);

const traceStats = await stat(tracePath).catch(() => null);
  const fileSize = traceStats ? (traceStats.size / (1024 * 1024)).toFixed(2) : 'unknown';
  if (debug) logger.info(`Tracing stopped: ${tracePath} (${fileSize} MB)`);

  const summary = await parseTrace(tracePath);
  if (debug) {
    logger.info(`Trace summary: ${JSON.stringify(summary, null, 2)}`);
  }

  return { tracePath, summary };
} catch (err) {
  logger.error(`Failed to stop tracing: ${err.message}`);
  throw err;
}

}; }

module.exports = { setupTracing };

