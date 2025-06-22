const express = require('express');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
const { analyzeUrl } = require('../utils/puppeteer');
const isValidUrl = require('../utils/isValidUrl');
const logger = require('../utils/logger');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const isProduction = process.env.NODE_ENV === 'production';

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
  'includeDomMetrics', 'includePerformanceMetrics',
  'captureAssetBodies', // ✅ Newly added option
];

function validateOptions(options) {
  if (typeof options !== 'object' || options === null) return false;
  return Object.keys(options).every(key => allowedOptions.includes(key));
}

function safeJson(obj) {
  return JSON.parse(JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value)));
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

    const analysisOptions = {
      ...options,
      includeDomMetrics: options.includeDomMetrics !== false,
      includePerformanceMetrics: options.includePerformanceMetrics !== false,
      debug: options.debug || true,
      captureAssetBodies: options.captureAssetBodies || false, // ✅ Added here
    };

    const analysisPromise = analyzeUrl(url, analysisOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timed out')), 600000)
    );

    const analysisData = await Promise.race([analysisPromise, timeoutPromise]);

    if (analysisData.error) {
      logger.request(req, `Analysis failed: ${url} | ${analysisData.error}`, 'error');
      return res.status(500).json({
        error: 'Analysis failed',
        message: analysisData.message || analysisData.error,
        details: analysisData.details,
      });
    }

    if (!analysisData.logs && !analysisData.requests) {
      logger.request(req, `Analysis fallback triggered for ${url}`, 'warn');
      return res.status(200).json({
        title: 'Analysis Incomplete',
        html: '',
        screenshot: '',
        logs: [],
        requests: [],
        performance: { domContentLoaded: -1, load: -1, firstPaint: -1, largestContentfulPaint: -1 },
        domMetrics: {},
        warning: 'Analysis completed with limited data due to initialization issues.',
        webSocket: null,
        summary: { errors: 0, warnings: 0, requests: 0, loadTime: 0 },
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
      webSocket: analysisData.webSocket || (analysisOptions.enableWebSocket ? { url: 'ws://localhost:8081', actions: ['click', 'reload'] } : null),
      summary: analysisData.summary || { errors: 0, warnings: 0, requests: 0, loadTime: 0 },
    };

    cache.set(cacheKey, responseData);
    logger.request(req, `Analysis completed: ${url}`, 'info');

    return res.json(safeJson(responseData));
  } catch (error) {
    logger.request(req, `Unexpected error: ${url} | ${error.stack || error.message}`, 'error');
    if (!isProduction) {
      return res.status(500).json({
        error: 'Analysis failed (Backend Error)',
        message: error.message,
        details: error.stack,
      });
    } else {
      return res.status(500).json({
        error: 'Analysis failed',
        message: 'An unexpected server error occurred.',
      });
    }
  }
});

module.exports = router;
