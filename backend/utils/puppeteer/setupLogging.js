const logger = require('../logger');
const { processConsoleArg, formatAndLogMessage } = require('./enhancedLogging');
const { OPEN } = require('ws');

function setupLogging(
  page,
  { onlyImportantLogs = false, captureStacks = true, debug = false, enableWebSocket = false, maxLogs = 200 },
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
      args: [],
      url: location?.url || '',
      lineNumber: location?.lineNumber ?? -1,
      columnNumber: location?.columnNumber ?? -1,
      frameId,
      frameUrl,
    };

    try {
      messageEntry.args = await Promise.all(msg.args().map(arg => processConsoleArg(arg, debug)));
      if (collectedConsoleLogs.length < maxLogs) collectedConsoleLogs.push(messageEntry);
      formatAndLogMessage(messageEntry, debug);
      sendWs('log', messageEntry);
    } catch (err) {
      messageEntry.args = [{ error: err.message, type: 'processingError' }];
      if (collectedConsoleLogs.length < maxLogs) collectedConsoleLogs.push(messageEntry);
      logger.warn(`Console arg error: ${err.message}`);
      sendWs('log', messageEntry);
    }
  });

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
    if (collectedConsoleLogs.length < maxLogs) collectedConsoleLogs.push(logEntry);
    logger.error(`Page error: ${err.message}`);
    formatAndLogMessage(logEntry, debug);
    sendWs('log', logEntry);
  });

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