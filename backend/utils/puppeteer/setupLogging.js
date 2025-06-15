const logger = require('../logger');
const { processConsoleArg, formatAndLogMessage } = require('./enhancedLogging');
const { OPEN } = require('ws');

function setupLogging(
  page,
  { onlyImportantLogs = false, captureStacks = true, debug = false, enableWebSocket = false, maxLogs = 1000 },
  collectedConsoleLogs,
  wsServer = null
) {
  const sendWs = (type, data) => {
    if (!enableWebSocket || !wsServer) return;
    wsServer.clients.forEach(client => {
      if (client.readyState === OPEN) client.send(JSON.stringify({ type, data }));
    });
  };

  page.on('console', async (msg) => {
    const type = msg.type();
    const normalizedType = ['log', 'error', 'warn', 'info'].includes(type) ? type : 'log';
    if (onlyImportantLogs && !['error', 'warn'].includes(normalizedType)) return;

    const location = msg.location();
    const frame = page.mainFrame();
    const frameId = frame?._id || (location.url ? `frame-${location.url}` : 'main');
    const frameUrl = frame?.url?.() || location.url || '';

    const messageEntry = {
      type: normalizedType,
      text: msg.text(),
      timestamp: Date.now(),
      args: await Promise.all(msg.args().map(arg => processConsoleArg(arg, debug))),
      url: location?.url || '',
      lineNumber: location?.lineNumber ?? -1,
      columnNumber: location?.columnNumber ?? -1,
      frameId,
      frameUrl,
    };

    if (collectedConsoleLogs.length < maxLogs) collectedConsoleLogs.push(messageEntry);
    formatAndLogMessage(messageEntry, debug);
    sendWs('log', messageEntry);
  });

  page.on('pageerror', (err) => {
    const logEntry = {
      type: 'error',
      text: `Page Unhandled Error: ${err.message}`,
      timestamp: Date.now(),
      args: [{ error: err.message, stack: err.stack, name: err.name || 'Error', raw: err.stack || '' }],
      url: err.url || page.url() || '',
      lineNumber: err.lineNumber ?? -1,
      columnNumber: err.columnNumber ?? -1,
      frameId: 'main',
      frameUrl: page.url() || '',
    };
    if (collectedConsoleLogs.length < maxLogs) collectedConsoleLogs.push(logEntry);
    logger.error(`Page error detected: ${err.message}`);
    formatAndLogMessage(logEntry, debug);
    sendWs('log', logEntry);
  });

  const handleFrameEvent = (eventType, frame) => {
    try {
      const meta = {
        type: 'info',
        text: `Frame ${eventType}: ${frame?.url() || 'unknown'}`,
        timestamp: Date.now(),
        args: [], // Explicitly set to empty array
        url: frame?.url() || 'about:blank',
        lineNumber: -1,
        columnNumber: -1,
        frameId: frame?._id || `frame-${frame?.url() || 'unknown'}`,
        frameUrl: frame?.url() || 'about:blank',
      };
      if (collectedConsoleLogs.length < maxLogs) collectedConsoleLogs.push(meta);
      formatAndLogMessage(meta, debug);
      sendWs('frame', meta);
    } catch (err) {
      logger.error(`Failed to handle frame ${eventType}: ${err.message}`, { stack: err.stack });
    }
  };

  page.on('frameattached', frame => handleFrameEvent('frameattached', frame));
  page.on('framedetached', frame => handleFrameEvent('framedetached', frame));
  page.on('framenavigated', frame => handleFrameEvent('framenavigated', frame));

  // Handle uncaught exceptions to prevent crashes
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
      reason: reason.message || reason,
      stack: reason.stack,
      promise,
    });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1); // Restart or exit gracefully
  });
}

module.exports = { setupLogging };