const util = require('util');
const logger = require('../logger');

/**
 * Attempts to process a JSHandle/console argument with maximum detail.
 * @param {import('puppeteer').JSHandle} arg
 * @param {boolean} debug
 * @returns {Promise<*>}
 */
async function processConsoleArg(arg, debug = false) {
  try {
    const remoteObj = arg.remoteObject();
    const type = remoteObj.type;
    const subtype = remoteObj.subtype;

    if (type === 'undefined') return { value: undefined, type };
    if (type === 'function') return { value: '[Function]', type, code: await arg.getProperty('toString').then(p => p.jsonValue()).catch(() => '[Code unavailable]') };
    if (type === 'symbol') return { value: '[Symbol]', type };
    if (type === 'bigint') return { value: remoteObj.value + 'n', type };
    if (type === 'object' || type === 'function') {
      if (subtype === 'error') {
        const errVal = await arg.evaluate(e => ({
          name: e.name,
          message: e.message,
          stack: e.stack || new Error().stack,
          isIndexedDB: e.message?.includes('IndexedDB'),
          isAbortError: e.name === 'AbortError' || e.message?.includes('AbortError'),
        })).catch(() => ({
          name: 'UnknownError',
          message: 'Error object inaccessible',
          stack: 'No stack trace available',
          isIndexedDB: remoteObj.description?.includes('IndexedDB'),
          isAbortError: remoteObj.description?.includes('AbortError'),
        }));
        return {
          error: true,
          name: errVal.name,
          message: errVal.message,
          stack: errVal.stack,
          isIndexedDB: errVal.isIndexedDB,
          isAbortError: errVal.isAbortError,
          type: 'errorObject',
          raw: remoteObj.description,
        };
      }

      const val = await arg.jsonValue().catch(err => {
        logger.warn(`JSON value failed: ${err.message}`, { remoteObj });
        return { error: err.message, raw: remoteObj.description };
      });
      return {
        value: typeof val === 'object' ? util.inspect(val, { depth: null }) : val,
        type,
        subtype,
        raw: remoteObj.description,
      };
    }

    return { value: remoteObj.value, type };
  } catch (err) {
    logger.error(`Failed to process arg: ${err.message}`, { remoteObj: arg.remoteObject() });
    return { error: err.message, type: 'processingError', raw: arg.toString() };
  }
}

/**
 * Logs a console message with full details in JSON format, handling undefined args.
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
  const location = `${msg.url || ''}:${msg.lineNumber || -1}:${msg.columnNumber || -1}`;
  const timestamp = new Date(msg.timestamp || Date.now()).toISOString();
  const context = msg.frameUrl && msg.frameUrl !== (msg.url || '') ? ` (frame: ${msg.frameUrl})` : '';

  const logEntry = {
    level: msg.type === 'error' ? 'error' : msg.type === 'warn' ? 'warn' : msg.type === 'info' ? 'info' : 'debug',
    message: msg.text || 'No message',
    url: msg.url || '',
    lineNumber: msg.lineNumber || -1,
    columnNumber: msg.columnNumber || -1,
    frameId: msg.frameId || 'main',
    frameUrl: msg.frameUrl || '',
    timestamp: msg.timestamp || Date.now(),
    isoTimestamp: timestamp,
    context,
    args: Array.isArray(msg.args) ? msg.args : [], // Ensure args is always an array
  };

  // Enhance for errors with detailed context
  const errorArg = (Array.isArray(msg.args) ? msg.args : []).find(arg => arg?.error);
  if (errorArg) {
    logEntry.errorDetails = {
      message: errorArg.message || msg.text,
      name: errorArg.name || 'UnknownError',
      stackTrace: errorArg.stack || 'No stack trace available',
      isIndexedDB: errorArg.isIndexedDB || false,
      isAbortError: errorArg.isAbortError || false,
      raw: errorArg.raw || '',
      args: (Array.isArray(msg.args) ? msg.args : []).map(arg => (typeof arg === 'object' ? util.inspect(arg, { depth: null }) : String(arg))),
    };
    logEntry.message = `Enhanced ${msg.type.toUpperCase()}: ${logEntry.message}`;
  }

  const jsonLog = JSON.stringify(logEntry, null, 2);
  logger[logEntry.level](jsonLog);
  if (debug) console.log(jsonLog);
}

module.exports = {
  processConsoleArg,
  formatAndLogMessage,
};