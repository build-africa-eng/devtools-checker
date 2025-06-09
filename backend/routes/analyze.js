lconst express = require('express');
const { analyzeUrl } = require('../utils/puppeteer');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const isValidUrl = require('../utils/isValidUrl');
const logger = require('../utils/logger');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many requests. Please try again later.',
});

router.post('/', limiter, async (req, res) => {
  const { url, options = {} } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (!url || typeof url !== 'string' || !url.trim()) {
    logger.warn(`Invalid request from ${ip}: Missing or empty URL`);
    return res.status(400).json({ error: 'A valid URL is required.' });
  }

  if (!isValidUrl(url)) {
    logger.warn(`Invalid request from ${ip}: ${url}`);
    return res.status(400).json({ error: 'Invalid URL format. Must start with http or https.' });
  }

  try {
    logger.info(`Analysis started: ${url} from ${ip} | Options: ${JSON.stringify(options)}`);

    const analysisData = await analyzeUrl(url, options);

    if (analysisData.error) {
      logger.error(`Analysis failed: ${url} | ${analysisData.error}`);
      return res.status(500).json({ 
        error: 'Analysis failed', 
        message: analysisData.error,
        details: analysisData.details 
      });
    }

    logger.info(`Analysis completed: ${url} for ${ip}`);
    return res.json(analysisData);
  } catch (error) {
    logger.error(`Unexpected error: ${url} | ${error.stack || error.message}`);
    return res.status(500).json({ 
      error: 'Analysis failed', 
      message: 'An unexpected server error occurred.' 
    });
  }
});

module.exports = router;