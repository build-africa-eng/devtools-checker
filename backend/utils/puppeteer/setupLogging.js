const logger = require('../logger');
const { processConsoleArg, formatAndLogMessage } = require('./enhancedLogging');
const { OPEN } = require('ws');

/**
 * Sets up logging and frame lifecycle tracking on a Puppeteer page.
 * @param {import('puppeteer').Page} page
 * @param {object} options
 * @param {boolean} options.onlyImportantLogs
 * @param {boolean} options.captureStacks
 * @param {boolean} options.debug
 * @param {boolean} options.enableWebSocket
 * @param {Array} collectedConsoleLogs
 * @param {WebSocket.Server|null} [wsServer=null]
 */
function setupLogging(
  page,
  {
    onlyImportantLogs = false,
    captureStacks = true,
    debug = false,
    enableWebSocket = false,
  },
  collectedConsoleLogs,
  wsServer = null
) {
  const sendWs = (type, data) => {
    if (!enableWebSocket || !wsServer) return;
    wsServer.clients.forEach(client => {
      if (client.readyState === OPEN) {
        client.send(JSON.stringify({ type, data }));
      }
    });
  };

  // Console message handler
  page.on('console', async (msg) => {
    const type = msg.type();
    const normalizedType = ['log', 'error', 'warn', 'info'].includes(type) ? type : 'log';
    if (onlyImportantLogs && !['error', 'warn'].includes(normalizedType)) return;

    const location = msg.location();
    // Use page.mainFrame() as a fallback since executionContext is unavailable
    const frame = page.mainFrame();
    const frameId = frame?._id || (location.url ? `frame-${location.url}` : 'main');
    const frameUrl = frame?.url?.() || location.url || '';

    const messageEntry = {
      type: normalizedType,
      text: msg.text(),
      timestamp: Date.now(),
      args: [],
      url: location?.url || '',
      lineNumber: location?.lineNumber ?? -1,
      columnNumber: location?.columnNumber ?? -1,
      frameId,
      frameUrl,
    };

    try {
      messageEntry.args = await Promise.all(msg.args().map(arg => processConsoleArg(arg, debug)));
    } catch (err) {
      messageEntry.args = [`Failed to process: ${err.message}`];
      logger.warn(`Console arg error: ${err.message}`);
    }

    collectedConsoleLogs.push(messageEntry);
    if (debug) formatAndLogMessage(messageEntry, debug);
    sendWs('log', messageEntry);
  });

  // Uncaught page errors
  page.on('pageerror', (err) => {
    const logEntry = {
      type: 'error',
      text: `Page Unhandled Error: ${err.message}`,
      timestamp: Date.now(),
      args: [{ error: err.message, stack: err.stack, name: err.name || 'Error' }],
      url: err.url || page.url() || '',
      lineNumber: err.lineNumber ?? -1,
      columnNumber: err.columnNumber ?? -1,
      frameId: 'main',
      frameUrl: page.url() || '',
    };
    collectedConsoleLogs.push(logEntry);
    logger.error(`Page error: ${err.message}`);
    sendWs('log', logEntry);
  });

  // Frame lifecycle: attach/detach/navigate
  const handleFrameEvent = (eventType, frame) => {
    try {
      const meta = {
        type: eventType,
        frameId: frame?._id || `frame-${frame?.url() || 'unknown'}`,
        url: frame?.url?.() || 'about:blank',
        parentFrame: frame?.parentFrame?.()?.url?.() || null,
        timestamp: Date.now(),
      };
      logger.info(`Frame ${eventType}: ${meta.url}`);
      collectedConsoleLogs.push(meta);
      sendWs('frame', meta);
    } catch (err) {
      logger.warn(`Error handling frame ${eventType}: ${err.message}`);
    }
  };

  page.on('frameattached', frame => handleFrameEvent('frameattached', frame));
  page.on('framedetached', frame => handleFrameEvent('framedetached', frame));
  page.on('framenavigated', frame => handleFrameEvent('framenavigated', frame));
}

module.exports = { setupLogging };