const util = require('util');
const logger = require('../logger');

/**
 * Attempts to stringify a JSHandle/console argument from Puppeteer.
 * Supports objects, primitives, functions, promises, and errors with detailed handling for IndexedDB and AbortError.
 * @param {import('puppeteer').JSHandle} arg
 * @param {boolean} debug
 * @returns {Promise<*>}
 */
async function processConsoleArg(arg, debug = false) {
  try {
    const remoteObj = arg.remoteObject();
    const type = remoteObj.type;

    if (type === 'undefined') return undefined;
    if (type === 'function') return '[Function]';
    if (type === 'symbol') return '[Symbol]';
    if (type === 'bigint') return remoteObj.value?.toString() + 'n';
    if (type === 'object' || type === 'function') {
      if (remoteObj.subtype === 'error') {
        // Enhanced handling for error objects, especially IndexedDB and AbortError
        const errVal = await arg.evaluate(e => ({
          name: e.name,
          message: e.message,
          stack: e.stack,
          isIndexedDB: e.message?.includes('IndexedDB'),
          isAbortError: e.name === 'AbortError',
        }));
        if (errVal.isIndexedDB || errVal.isAbortError) {
          return {
            error: true,
            name: errVal.name,
            message: errVal.message,
            stack: errVal.stack || 'No stack trace available',
            type: 'detailedError',
          };
        }
        return `[Error] ${errVal.name}: ${errVal.message}`;
      }

      // Attempt structured clone, fallback to string
      const val = await arg.jsonValue().catch(() => '[Unserializable]');
      if (debug) return val;
      return typeof val === 'object' ? util.inspect(val, { depth: 2 }) : val;
    }

    // For primitive values
    return remoteObj.value;
  } catch (err) {
    return `[Error processing arg: ${err.message}]`;
  }
}

/**
 * Pretty-prints a collected console message to the logger with enhanced details for IndexedDB and AbortError.
 * @param {object} msg
 * @param {string} msg.type
 * @param {string} msg.text
 * @param {number} msg.timestamp
 * @param {Array} msg.args
 * @param {string} msg.url
 * @param {number} msg.lineNumber
 * @param {number} msg.columnNumber
 * @param {string} msg.frameId
 * @param {string} msg.frameUrl
 * @param {boolean} debug
 */
function formatAndLogMessage(msg, debug = false) {
  const location = `${msg.url}:${msg.lineNumber}:${msg.columnNumber}`;
  const header = `[${msg.type.toUpperCase()}] ${location} @ ${new Date(msg.timestamp).toISOString()}`;
  const context = msg.frameUrl && msg.frameUrl !== msg.url ? ` (frame: ${msg.frameUrl})` : '';

  // Enhance logging for IndexedDB and AbortError
  const isIndexedDBError = msg.text.includes('IndexedDB') || msg.args.some(arg => arg?.isIndexedDB);
  const isAbortError = msg.text.includes('AbortError') || msg.args.some(arg => arg?.isAbortError);

  if (isIndexedDBError || isAbortError) {
    const errorArg = msg.args.find(arg => arg?.error) || {};
    const enhancedLog = {
      level: msg.type === 'error' ? 'error' : msg.type === 'warn' ? 'warn' : 'info',
      message: `Enhanced ${msg.type.toUpperCase()}: ${msg.text}`,
      url: msg.url,
      lineNumber: msg.lineNumber,
      columnNumber: msg.columnNumber,
      frameId: msg.frameId,
      frameUrl: msg.frameUrl,
      timestamp: msg.timestamp,
      errorDetails: {
        message: errorArg.message || msg.text,
        name: errorArg.name || 'UnknownError',
        stackTrace: errorArg.stack || 'No stack trace available',
        args: msg.args.map(arg => (typeof arg === 'object' ? util.inspect(arg, { depth: 2 }) : String(arg))),
      },
    };

    logger[enhancedLog.level](JSON.stringify(enhancedLog));
    if (debug) console.log(JSON.stringify(enhancedLog, null, 2));
  } else {
    const argsString = msg.args?.length
      ? msg.args.map(a => (typeof a === 'object' ? util.inspect(a, { depth: 2 }) : String(a))).join('\n')
      : '';
    const output = `${header}${context}\n${msg.text}\n${argsString}`;

    switch (msg.type) {
      case 'error':
        logger.error(output);
        break;
      case 'warn':
        logger.warn(output);
        break;
      case 'info':
        logger.info(output);
        break;
      default:
        logger.debug(output);
    }
  }
}

module.exports = {
  processConsoleArg,
  formatAndLogMessage,
};