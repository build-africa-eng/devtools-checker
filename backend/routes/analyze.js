const express = require('express');
const { analyzeUrl } = require('../utils/puppeteer');
const router = express.Router();

router.post('/', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const data = await analyzeUrl(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

module.exports = router;