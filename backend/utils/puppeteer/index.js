const isValidUrl = require('../isValidUrl');
const logger = require('../logger');
const { launchBrowserWithRetries } = require('./launchBrowser');
const { setupLogging } = require('./setupLogging');
const { setupNetworkCapture } = require('./setupNetworkCapture');
const { runLighthouse } = require('./runLighthouse');
const { runAccessibility } = require('./runAccessibility');
const { setupTracing } = require('./setupTracing');
const { captureTouchAndGestureEvents, captureHtml, captureScreenshot, captureMobileMetrics, getDomMetrics, inspectElement, executeScript } = require('./helpers');
const WebSocket = require('ws');
const fs = require('fs').promises;

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
      navigationTimeout = 600000, // Increased to 60 seconds
      networkConditionsType = null, // Disabled network conditions
      inspectElement: inspectSelector = null,
      filterRequestTypes = ['document', 'xhr', 'fetch', 'script'],
      filterDomains = [],
      executeScript: scriptToRun = null,
      debug = false,
      enableWebSocket = false,
      cpuThrottlingRate = 1,
      followLinks = false,
      maxLinks = 5,
      requestTimeout = 300000,
      outputDir = './analysis',
    } = options;

    await fs.mkdir(outputDir, { recursive: true });

    let webSocketUrl = null;
    if (enableWebSocket) {
      if (process.env.NODE_ENV === 'production') {
        webSocketUrl = process.env.WEBSOCKET_URL || null;
        if (debug) logger.info(`WebSocket in production mode, url: ${webSocketUrl}`);
      } else {
        wsServer = new WebSocket.Server({ port: 8081 });
        webSocketUrl = 'ws://localhost:8081';
        wsServer.on('connection', (ws) => {
          if (debug) logger.info('WebSocket client connected');
          ws.on('message', async (msg) => {
            try {
              const { action, data } = JSON.parse(msg);
              if (action === 'click' && data.selector) {
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
    }

    ({ browser, page } = await launchBrowserWithRetries({
      retries: 3,
      device,
      customDevice,
      debug,
      blockHosts: true,
    }));
    if (!page) {
      logger.warn(`Browser initialization failed for ${url}, proceeding with fallback`);
      return {
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
      };
    }
    await page.setBypassCSP(true);

    // Network emulation disabled
    if (debug) logger.info('Network monitoring and emulation disabled to avoid timeouts');

    await page.emulateCPUThrottling(cpuThrottlingRate);
    if (debug && cpuThrottlingRate !== 1) logger.info(`Applied CPU throttling: ${cpuThrottlingRate}x`);

    const touchEvents = [];
    const gestureEvents = [];
    await captureTouchAndGestureEvents(page);

    const collectedLogs = [];
    setupLogging(page, {
      maxLogs,
      onlyImportantLogs,
      captureStacks,
      debug,
      enableWebSocket,
    }, collectedLogs, wsServer);

    const { requests, networkWaterfall } = await setupNetworkCapture(page, {
      captureHeaders,
      captureResponseBodies,
      maxBodySize,
      maxRequests,
      filterRequestTypes,
      filterDomains,
      requestTimeout,
      outputDir,
      enableWebSocket,
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

    const performanceMetrics = await page.metrics();
    const domMetrics = await getDomMetrics(page, debug);
    const warning = collectedLogs.some(l => l.level === 'warning') ? 'Some warnings detected in logs' : null;

    result.title = await page.title();
    result.html = includeHtml ? await captureHtml(page, debug) : '';
    result.screenshot = includeScreenshot ? await captureScreenshot(page, outputDir, debug) : '';
    result.logs = collectedLogs;
    result.requests = Array.isArray(requests) ? requests : [];
    result.performance = {
      domContentLoaded: performanceMetrics.DOMContentLoaded || -1,
      load: loadTime / 1000,
      firstPaint: performanceMetrics.FirstPaint || -1,
      largestContentfulPaint: performanceMetrics.LargestContentfulPaint || -1,
    };
    result.domMetrics = domMetrics || {};
    result.warning = warning;
    result.webSocket = enableWebSocket && webSocketUrl ? { url: webSocketUrl, actions: ['click', 'reload'] } : null;

    result.summary = {
      errors: collectedLogs.filter(l => l.level === 'PAGE_ERROR' || l.type === 'error').length,
      warnings: collectedLogs.filter(l => l.level === 'warning' || l.type === 'warn').length,
      requests: requests.length,
      loadTime,
    };

    if (includeLighthouse) result.lighthouse = await runLighthouse(page, browser, debug);
    if (includeAccessibility) result.accessibility = await runAccessibility(page, debug);
    if (inspectSelector) result.element = await inspectElement(page, inspectSelector, debug);
    if (scriptToRun) result.scriptResult = await executeScript(page, scriptToRun, debug);

    if (followLinks) {
      const links = await page.$$eval('a', as =>
        as.map(a => a.href).filter(href => href.startsWith('http'))
      );
      result.relatedPages = await Promise.all(
        [...new Set(links)].slice(0, maxLinks).map(link =>
          analyzeUrl(link, { ...options, followLinks: false }).catch(err => ({
            url: link,
            error: err.message,
          }))
        )
      );
    }

    return result;
  } catch (err) {
    logger.error(`Analysis failed: ${err.message}`);
    return { error: err.message };
  } finally {
    if (wsServer) wsServer.close();
    if (browser) {
      try {
        await browser.close();
        if (options.debug) logger.info('Browser closed');
      } catch (err) {
        if (options.debug) logger.warn(`Error closing browser: ${err.message}`);
      }
    }
  }
}

module.exports = { analyzeUrl };