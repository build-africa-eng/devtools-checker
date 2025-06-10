const { logger } = require('./logger');

function setupLogging(page, options, touchEvents, gestureEvents, wsServer) {
  const { maxLogs = 200, onlyImportantLogs = false, captureStacks = true, debug = false, enableWebSocket = false } = options;
  const logs = [];

  page.on('console', async (msg) => {
    if (logs.length >= maxLogs) return;
    const level = msg.type();
    if (onlyImportantLogs && !['error', 'warning'].includes(level)) return;

    const args = await Promise.all(msg.args().map(arg => arg.jsonValue().catch(() => arg.toString())));
    const logEntry = { level, message: msg.text(), location: msg.location(), timestamp: new Date().toISOString(), args };

    if (msg.text().startsWith('Touch event:')) {
      try {
        touchEvents.push(JSON.parse(msg.text().replace('Touch event:', '')));
      } catch {}
    } else if (msg.text().startsWith('Gesture event:')) {
      try {
        gestureEvents.push(JSON.parse(msg.text().replace('Gesture event:', '')));
      } catch {}
    }

    if (captureStacks && msg.stackTrace()) {
      logEntry.stack = msg.stackTrace().map(f => ({ file: f.url, line: f.lineNumber, column: f.columnNumber }));
    }

    logs.push(logEntry);

    if (enableWebSocket && wsServer) {
      wsServer.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'log', data: logEntry }));
        }
      });
    }
  });

  page.on('pageerror', (err) => {
    if (logs.length < maxLogs) {
      const errorLog = { level: 'PAGE_ERROR', message: err.message, stack: err.stack, timestamp: new Date().toISOString() };
      logs.push(errorLog);
      if (enableWebSocket && wsServer) {
        wsServer.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'error', data: errorLog }));
          }
        });
      }
    }
  });

  return logs;
}

module.exports = { setupLogging };