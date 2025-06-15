const express = require('express');
const router = express.Router();
const { launchBrowserWithRetries } = require('../utils/puppeteer/launchBrowser');
const logger = require('../logger');

router.post('/analyze', async (req, res) => {
  const { url } = req.body;
  const requestId = req.requestId || 'unknown';
  const ip = req.ip;

  logger.info(`Analysis started: ${url} | requestId=${requestId} ip=${ip} method=POST url=/api/analyze`);

  let browserInstance = null;
  try {
    const timeoutDuration = 300000; // Increase to 300 seconds (5 minutes)
    const analysisTimeout = setTimeout(() => {
      if (browserInstance) {
        browserInstance.browser?.close();
      }
      logger.error(`Analysis timed out: ${url} | Error: Analysis timed out | requestId=${requestId} ip=${ip} method=POST url=/api/analyze`);
      res.status(504).json({ error: 'Analysis timed out' });
    }, timeoutDuration);

    const { browser, page, collectedConsoleLogs, collectedRequests } = await launchBrowserWithRetries({
      device: 'iPhone 12',
      debug: true,
      sessionId: Date.now(),
    });

    browserInstance = { browser };

    if (!page) {
      logger.warn(`No page instance available, proceeding with collected data: ${url}`);
      clearTimeout(analysisTimeout);
      return res.status(200).json({ logs: collectedConsoleLogs, requests: collectedRequests });
    }

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    // Add your analysis logic here

    clearTimeout(analysisTimeout);
    logger.info(`Analysis completed: ${url} | requestId=${requestId}`);
    res.status(200).json({ logs: collectedConsoleLogs, requests: collectedRequests });
  } catch (err) {
    if (browserInstance) {
      browserInstance.browser?.close();
    }
    logger.error(`Unexpected error: ${url} | ${err.message} | requestId=${requestId} ip=${ip} method=POST url=/api/analyze`);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;