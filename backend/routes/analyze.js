const express = require('express');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const { analyzeUrl } = require('../utils/puppeteer');
const { isUrlValid } = require('../utils/isUrlValid');
const { logger } = require('../utils/logger');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // Cache for 10 minutes

// Rate limiter: 10 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests from this IP. Please try again after 1 minute.',
  },
});

// Allowed options for validation
const allowedOptions = [
  'device', 'customDevice', 'includeHtml', 'includeScreenshot', 'includeLighthouse',
  'includeAccessibility', 'includePerformanceTrace', 'captureStacks', 'captureHeaders',
  'captureResponseBodies', 'maxBodySize', 'maxLogs', 'maxRequests', 'onlyImportantLogs',
  'navigationTimeout', 'networkConditionsType', 'inspectElement', 'filterRequestTypes',
  'filterDomains', 'executeScript', 'debug', 'enableWebSocket', 'cpuThrottlingRate',
  'followLinks', 'maxLinks', 'requestTimeout', 'outputDir',
];

// Helper to validate options
function validateOptions(options) {
  if (typeof options !== 'object' || options === null) return false;
  return Object.keys(options).every(key => allowedOptions.includes(key));
}

// Helper to safely serialize BigInt
function safeJson(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

// POST /api/analyze
router.post('/', limiter, async (req, res) => {
  const { url, options = {} } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Validate URL
  if (!url || typeof url !== 'string' || !url.trim()) {
    logger('warn', `Invalid request from ${ip}: Missing or empty URL`);
    return res.status(400).json({ error: 'A valid URL is required.' });
  }
  if (!isUrlValid(url) || !url.match(/^https?:\/\//)) {
    logger('warn', `Invalid request from ${ip}: ${url}`);
    return res.status(400).json({ error: 'Invalid URL format. Must start with http or https.' });
  }

  // Validate options
  if (!validateOptions(options)) {
    logger('warn', `Invalid options from ${ip}: ${JSON.stringify(options)}`);
    return res.status(400).json({
      error: 'Invalid options',
      message: 'Provided options are not supported.',
      supportedOptions: allowedOptions,
    });
  }

  // Check cache
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    logger('info', `Cache hit for ${url} from ${ip}`);
    return res.json(safeJson(cachedResult));
  }

  try {
    logger('info', `Analysis started: ${url} from ${ip} | Options: ${JSON.stringify(options)}`);

    // Set timeout for analysis (e.g., 60 seconds)
    const analysisPromise = analyzeUrl(url, { ...options, debug: options.debug || true });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timed out')), 60000)
    );
    const analysisData = await Promise.race([analysisPromise, timeoutPromise]);

    if (analysisData.error) {
      logger('error', `Analysis failed: ${url} | ${analysisData.error}`);
      return res.status(500).json({
        error: 'Analysis failed',
        message: analysisData.error,
        details: analysisData.details,
      });
    }

    // Cache result
    cache.set(cacheKey, analysisData);
    logger('info', `Analysis completed: ${url} for ${ip}`);

    // Add WebSocket info if enabled
    if (options.enableWebSocket) {
      analysisData.webSocket = { url: 'ws://localhost:8081', actions: ['click', 'reload'] };
    }

    return res.json(safeJson(analysisData));
  } catch (error) {
    logger('error', `Unexpected error: ${url} | ${error.stack || error.message}`);
    return res.status(500).json({
      error: 'Analysis failed',
      message: 'An unexpected server error occurred.',
    });
  }
});

// GET /api/analyze (for simple queries)
router.get('/', limiter, async (req, res) => {
  const { url } = req.query;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!url || !isUrlValid(url) || !url.match(/^https?:\/\//)) {
    logger('warn', `Invalid GET request from ${ip}: ${url}`);
    return res.status(400).json({ error: 'Invalid or missing URL in query parameters.' });
  }

  try {
    logger('info', `GET analysis started: ${url} from ${ip}`);
    const analysisData = await analyzeUrl(url, { debug: true });
    if (analysisData.error) {
      logger('error', `GET analysis failed: ${url} | ${analysisData.error}`);
      return res.status(500).json({
        error: 'Analysis failed',
        message: analysisData.error,
      });
    }
    logger('info', `GET analysis completed: ${url} for ${ip}`);
    return res.json(safeJson(analysisData));
  } catch (error) {
    logger('error', `Unexpected GET error: ${url} | ${error.stack || error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;