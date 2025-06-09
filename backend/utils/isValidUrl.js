const { URL } = require('url');
const logger = require('./logger');

/**
 * Validates URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL format
 */
function isValidUrl(url) {
  try {
    if (typeof url !== 'string' || url.length > 2048) {
      logger.warn(`Invalid URL: Length exceeds 2048 characters or not a string: ${url.slice(0, 50)}...`);
      return false;
    }
    const parsed = new URL(url);
    const isValid = ['http:', 'https:'].includes(parsed.protocol);
    if (!isValid) {
      logger.warn(`Invalid URL protocol: ${parsed.protocol} for ${url}`);
    }
    return isValid;
  } catch (error) {
    logger.warn(`Invalid URL format: ${url} | Error: ${error.message}`);
    return false;
  }
}

module.exports = { isValidUrl };