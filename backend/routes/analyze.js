const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { analyzeUrl } = require('./analyzeUrl'); // adjust path if needed
const isValidUrl = require('./utils/isValidUrl'); // assumes helper for URL validation
const logger = require('./logger'); // assumes Winston or custom logger

// Optional rate limiter (adjust per your needs)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests. Please try again later.',
});

router.post('/', limiter, async (req, res) => {
  const { url, options } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  // --- Validate URL ---
  if (!url || typeof url !== 'string' || !url.trim()) {
    logger.warn(`Invalid request from ${ip}: Missing or empty URL`);
    return res.status(400).json({ error: 'A valid URL is required.' });
  }

  if (!isValidUrl(url)) {
    logger.warn(`Invalid request from ${ip}: ${url}`);
    return res.status(400).json({ error: 'Invalid URL format. Must start with http or https.' });
  }

  try {
    logger.info(`Starting analysis for ${url} from ${ip}. Options: ${JSON.stringify(options)}`);

    const analysisData = await analyzeUrl(url, options);

    if (analysisData.error) {
      logger.error(`Analysis failed for ${url}: ${analysisData.error}. Details: ${analysisData.details}`);
      return res.status(500).json({ error: 'Analysis failed', message: analysisData.error });
    }

    logger.info(`Successfully analyzed ${url} for ${ip}`);
    return res.json(analysisData);

  } catch (error) {
    logger.error(`Unexpected error for ${url} from ${ip}: ${error.stack || error.message}`);
    return res.status(500).json({ error: 'Analysis failed', message: 'An unexpected error occurred.' });
  }
});

module.exports = router;