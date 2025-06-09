const { URL } = require('url');
const WebSocket = require('ws');
const fs = require('fs').promises;
const { isValidUrl } = require('../isValidUrl');
const { logger } = require('../logger');
const { launchBrowserWithRetries } = require('./launchBrowser');
const { setupLogging } = require('./setupLogging');
const { setupNetworkCapture } = require('./setupNetworkCapture');
const { runLighthouse } = require('./runLighthouse');
const { runAccessibility } = require('./runAccessibility');
const { setupTracing } = require('./setupTracing');
const {
  captureTouchAndGestureEvents,
  captureHtml,
  captureScreenshot,
  captureMobileMetrics,
  inspectElement,
  executeScript
} = require('./helpers');

/**
 * Analyzes a webpage URL, mimicking Chrome DevTools for mobile users
 * @param {string} url - Target URL
 * @param {object} options - Configuration
 * @returns {Promise<object>} Analysis result
 */
async function analyzeUrl(url, options = {}) {
  let browser, page, wsServer;

  const result = {};

  try {
    if (!isValidUrl(url)) throw new Error('Invalid URL');

    const {
      device = 'iPhone 12',
      customDevice = null,
      includeHtml = false,
      includeScreenshot = false,
      includeLighthouse = false,
      includeAccessibility = false,
      includePerformanceTrace = false,
      captureStacks = true,
      captureHeaders = false,
      captureResponseBodies = false,
      maxBodySize = 10240,
      maxLogs = 200,
      maxRequests = 500,
      onlyImportantLogs = false,
      navigationTimeout = 30000,
      networkConditionsType = 'Fast 4G',
      inspectElement: inspectSelector = null,
      filterRequestTypes = ['document', 'xhr', 'fetch', 'script'],
      filterDomains = [],
      executeScript: scriptToRun = null,
      debug = false,
      enableWebSocket = false,
      cpuThrottlingRate = 1,
      followLinks = false,
      maxLinks = 5,
      requestTimeout = 10000,
      outputDir = './analysis',
    } = options;

    await fs.mkdir(outputDir, { recursive: true });

    ({ browser, page } = await launchBrowserWithRetries(3, device, customDevice, debug));
    await page.setBypassCSP(true);

    // Emulate network conditions
    if (global.NETWORK_CONDITIONS && global.NETWORK_CONDITIONS[networkConditionsType]) {
      await page.emulateNetworkConditions(global.NETWORK_CONDITIONS[networkConditionsType]);
      if (debug) logger('info', `Using network: ${networkConditionsType}`);
    }

    // Emulate CPU throttling
    await page.emulateCPUThrottling(cpuThrottlingRate);
    if (debug && cpuThrottlingRate !== 1) logger('info', `Applied CPU throttling: ${cpuThrottlingRate}x`);

    // WebSocket setup
    if (enableWebSocket) {
      wsServer = new WebSocket.Server({ port: 8081 });
      wsServer.on('connection', (ws) => {
        if (debug) logger('info', 'WebSocket client connected');
        ws.on('message', async (msg) => {
          try {
            const { action, data } = JSON.parse(msg);
            if (action === 'click') {
              await page.click(data.selector);
              ws.send(JSON.stringify({ status: 'Clicked', selector: data.selector }));
            } else if (action === 'reload') {
              await page.reload();
              ws.send(JSON.stringify({ status: 'Reloaded' }));
            }
          } catch (err) {
            ws.send(JSON.stringify({ error: err.message }));
          }
        });
      });
    }

    const touchEvents = [];
    const gestureEvents = [];
    await captureTouchAndGestureEvents(page);

    const logs = setupLogging(page, {
      maxLogs,
      onlyImportantLogs,
      captureStacks,
      debug,
      enableWebSocket
    }, touchEvents, gestureEvents, wsServer);

    const { requests, networkWaterfall } = await setupNetworkCapture(page, {
      captureHeaders,
      captureResponseBodies,
      maxBodySize,
      maxRequests,
      filterRequestTypes,
      filterDomains,
      requestTimeout,
      outputDir,
      enableWebSocket
    }, wsServer);

    let stopTracing;
    if (includePerformanceTrace) {
      stopTracing = await setupTracing(page, outputDir, debug);
    }

    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: navigationTimeout });
    const loadTime = Date.now() - startTime;

    if (includePerformanceTrace && stopTracing) {
      result.performanceTrace = await stopTracing();
    }

    // Base metadata
    result.title = await page.title();
    result.loadTime = loadTime;
    result.logs = logs;
    result.requests = requests;
    result.touchEvents = touchEvents;
    result.gestureEvents = gestureEvents;
    result.networkWaterfall = networkWaterfall();
    result.mobileMetrics = await captureMobileMetrics(page, debug);

    result.summary = {
      errors: logs.filter(l => l.level === 'PAGE_ERROR').length,
      warnings: logs.filter(l => l.level === 'warning').length,
      requests: requests.length,
      loadTime
    };

    // Optional captures
    if (includeHtml) result.html = await captureHtml(page, debug);
    if (includeScreenshot) result.screenshot = await captureScreenshot(page, outputDir, debug);
    if (includeLighthouse) result.lighthouse = await runLighthouse(page, browser, debug);
    if (includeAccessibility) result.accessibility = await runAccessibility(page, debug);
    if (inspectSelector) result.element = await inspectElement(page, inspectSelector, debug);
    if (scriptToRun) result.scriptResult = await executeScript(page, scriptToRun, debug);

    // Recursive analysis of links
    if (followLinks) {
      const links = await page.$$eval('a', as =>
        as.map(a => a.href).filter(href => href.startsWith('http'))
      );
      result.relatedPages = await Promise.all(
        [...new Set(links)].slice(0, maxLinks).map(link =>
          analyzeUrl(link, { ...options, followLinks: false }).catch(err => ({
            url: link,
            error: err.message
          }))
        )
      );
    }

    return result;

  } catch (err) {
    logger('error', `Analysis failed: ${err.message}`);
    return { error: err.message };
  } finally {
    if (wsServer) wsServer.close();
    if (browser) {
      try {
        await browser.close();
        if (options.debug) logger('info', 'Browser closed');
      } catch (err) {
        if (options.debug) logger('warn', `Error closing browser: ${err.message}`);
      }
    }
  }
}

module.exports = { analyzeUrl };