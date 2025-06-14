const express = require('express');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const analyzeUrl = require('../utils/puppeteer');
const isValidUrl = require('../utils/isValidUrl');
const logger = require('../utils/logger');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests from this IP. Please try again after 1 minute.',
  },
});

const allowedOptions = [
  'device', 'customDevice', 'includeHtml', 'includeScreenshot', 'includeLighthouse',
  'includeAccessibility', 'includePerformanceTrace', 'captureStacks', 'captureHeaders',
  'captureResponseBodies', 'maxBodySize', 'maxLogs', 'maxRequests', 'onlyImportantLogs',
  'navigationTimeout', 'networkConditionsType', 'inspectElement', 'filterRequestTypes',
  'filterDomains', 'executeScript', 'debug', 'enableWebSocket', 'cpuThrottlingRate',
  'followLinks', 'maxLinks', 'requestTimeout', 'outputDir',
  // Add new options for DOM and performance
  'includeDomMetrics', 'includePerformanceMetrics',
];

function validateOptions(options) {
  if (typeof options !== 'object' || options === null) return false;
  return Object.keys(options).every(key => allowedOptions.includes(key));
}

function safeJson(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

router.post('/', limiter, async (req, res) => {
  const { url, options = {} } = req.body;

  if (!url || typeof url !== 'string' || !url.trim()) {
    logger.request(req, 'Invalid request: Missing or empty URL', 'warn');
    return res.status(400).json({ error: 'A valid URL is required.' });
  }
  if (!isValidUrl(url)) {
    logger.request(req, `Invalid URL format: ${url}`, 'warn');
    return res.status(400).json({ error: 'Invalid URL format. Must start with http or https.' });
  }

  if (!validateOptions(options)) {
    logger.request(req, `Invalid options: ${JSON.stringify(options)}`, 'warn');
    return res.status(400).json({
      error: 'Invalid options',
      message: 'Provided options are not supported.',
      supportedOptions: allowedOptions,
    });
  }

  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    logger.request(req, `Cache hit for ${url}`, 'info');
    return res.json(safeJson(cachedResult));
  }

  try {
    logger.request(req, `Analysis started: ${url}`, 'info', { options });

    // Default to including DOM and performance metrics
    const analysisOptions = {
      ...options,
      includeDomMetrics: options.includeDomMetrics !== false, // Default to true
      includePerformanceMetrics: options.includePerformanceMetrics !== false, // Default to true
      debug: options.debug || true,
    };

    const analysisPromise = analyzeUrl(url, analysisOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timed out')), 60000)
    );
    const analysisData = await Promise.race([analysisPromise, timeoutPromise]);

    if (analysisData.error) {
      logger.request(req, `Analysis failed: ${url} | ${analysisData.error}`, 'error');
      return res.status(500).json({
        error: 'Analysis failed',
        message: analysisData.error,
        details: analysisData.details,
      });
    }

    // Ensure response matches frontend expectations
    const responseData = {
      title: analysisData.title || 'Untitled Page',
      html: analysisData.html || '',
      screenshot: analysisData.screenshot || '',
      logs: Array.isArray(analysisData.logs) ? analysisData.logs : [],
      requests: Array.isArray(analysisData.requests) ? analysisData.requests : [],
      performance: analysisData.performance || { domContentLoaded: -1, load: -1, firstPaint: -1, largestContentfulPaint: -1 },
      domMetrics: analysisData.domMetrics || {},
      warning: analysisData.warning || null,
      webSocket: analysisData.webSocket || (analysisOptions.enableWebSocket ? { url: 'ws://localhost:8081', actions: ['click', 'reload'] } : null),
      summary: analysisData.summary || { errors: 0, warnings: 0, requests: 0, loadTime: 0 },
    };

    cache.set(cacheKey, responseData);
    logger.request(req, `Analysis completed: ${url}`, 'info');

    return res.json(safeJson(responseData));
  } catch (error) {
    logger.request(req, `Unexpected error: ${url} | ${error.stack || error.message}`, 'error');
    return res.status(500).json({
      error: 'Analysis failed',
      message: 'An unexpected server error occurred.',
    });
  }
});

router.get('/', limiter, async (req, res) => {
  const { url } = req.query;

  if (!url || !isValidUrl(url)) {
    logger.request(req, `Invalid GET request: ${url}`, 'warn');
    return res.status(400).json({ error: 'Invalid or missing URL in query parameters.' });
  }

  try {
    logger.request(req, `GET analysis started: ${url}`, 'info');
    const analysisData = await analyzeUrl(url, { debug: true, includeDomMetrics: true, includePerformanceMetrics: true });
    if (analysisData.error) {
      logger.request(req, `GET analysis failed: ${url} | ${analysisData.error}`, 'error');
      return res.status(500).json({
        error: 'Analysis failed',
        message: analysisData.error,
      });
    }

    const responseData = {
      title: analysisData.title || 'Untitled Page',
      html: analysisData.html || '',
      screenshot: analysisData.screenshot || '',
      logs: Array.isArray(analysisData.logs) ? analysisData.logs : [],
      requests: Array.isArray(analysisData.requests) ? analysisData.requests : [],
      performance: analysisData.performance || { domContentLoaded: -1, load: -1, firstPaint: -1, largestContentfulPaint: -1 },
      domMetrics: analysisData.domMetrics || {},
      warning: analysisData.warning || null,
      webSocket: analysisData.webSocket || { url: 'ws://localhost:8081', actions: ['click', 'reload'] },
      summary: analysisData.summary || { errors: 0, warnings: 0, requests: 0, loadTime: 0 },
    };

    logger.request(req, `GET analysis completed: ${url}`, 'info');
    return res.json(safeJson(responseData));
  } catch (error) {
    logger.request(req, `Unexpected GET error: ${url} | ${error.stack || error.message}`, 'error');
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;