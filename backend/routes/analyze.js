const express = require('express');
const { analyzeUrl } = require('../utils/puppeteer');
const router = express.Router();

router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'A valid URL is required' });
  }
  try {
    const data = await analyzeUrl(url);
    res.json(data);
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

module.exports = router;