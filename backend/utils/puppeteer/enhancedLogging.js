const util = require('util');
const logger = require('../logger');

/**
 * Attempts to stringify a JSHandle/console argument from Puppeteer.
 * Supports objects, primitives, functions, promises, and errors.
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
        // For native error objects
        const errVal = await arg.evaluate(e => ({
          name: e.name,
          message: e.message,
          stack: e.stack,
        }));
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
 * Pretty-prints a collected console message to the logger.
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

module.exports = {
  processConsoleArg,
  formatAndLogMessage,
};