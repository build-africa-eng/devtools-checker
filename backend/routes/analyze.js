const express = require('express');
const { analyzeUrl } = require('../utils/puppeteer');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const router = express.Router();

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

// Rate limiter: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests
  message: { error: 'Too many requests, please try again later' },
});

// Validate URL
const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    // Only allow http or https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

router.post('/', limiter, async (req, res) => {
  const { url } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  if (!url || typeof url !== 'string' || !url.trim()) {
    logger.warn(`Invalid URL request from ${ip}: URL missing or empty`);
    return res.status(400).json({ error: 'A valid URL is required' });
  }

  if (!isValidUrl(url)) {
    logger.warn(`Invalid URL request from ${ip}: ${url}`);
    return res.status(400).json({ error: 'Invalid URL format (must be http or https)' });
  }

  try {
    logger.info(`Analyzing URL: ${url} from ${ip}`);
    const data = await analyzeUrl(url);

    if (data.error) {
      logger.error(`Analysis failed for ${url}: ${data.error}`);
      return res.status(500).json({ error: 'Analysis failed', message: 'Unable to process the page' });
    }

    res.json({ data });
    logger.info(`Successfully analyzed ${url} for ${ip}`);
  } catch (error) {
    logger.error(`Unexpected error for ${url}: ${error.message}`);
    res.status(500).json({ error: 'Analysis failed', message: 'An unexpected error occurred' });
  }
});

module.exports = router;