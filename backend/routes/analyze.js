const express = require('express');
const { analyzeUrl } = require('../utils/puppeteer'); // Update path
const router = express.Router();

router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  if (typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    console.log(`Analyzing URL: ${url}`);
    const data = await analyzeUrl(url);
    console.log(`Analysis successful for ${url}:`, { logsLength: data.logs.length, requestsLength: data.requests.length });
    res.json(data);
  } catch (error) {
    console.error(`Analysis failed for ${url}:`, error.message, error.stack);
    res.status(500).json({ error: 'Analysis failed', details: error.message, stack: error.stack });
  }
});

module.exports = router;
