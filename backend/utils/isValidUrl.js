// backend/utils/isValidUrl.js
const { URL } = require('url');
const ipaddr = require('ipaddr.js');
const logger = require('./logger');

/**
 * Validates URL format and checks for private IPs
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL and not a private IP
 */
function isValidUrl(url) {
  try {
    if (typeof url !== 'string' || url.length > 2048) {
      logger.warn(`Invalid URL: Length exceeds 2048 or not a string: ${url.slice(0, 50)}...`);
      return false;
    }
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      logger.warn(`Invalid URL protocol: ${parsed.protocol} for ${url}`);
      return false;
    }

    const hostname = parsed.hostname;
    // Check if hostname is an IP address
    try {
      const addr = ipaddr.parse(hostname);
      if (addr.isPrivate()) {
        logger.warn(`Private IP rejected: ${hostname}`);
        return false;
      }
    } catch (e) {
      // Not an IP address (e.g., domain name), continue validation
    }

    // Additional checks for localhost
    if (hostname.toLowerCase() === 'localhost') {
      logger.warn(`Localhost rejected: ${hostname}`);
      return false;
    }

    return true;
  } catch (error) {
    logger.warn(`Invalid URL format: ${url} | Error: ${error.message}`);
    return false;
  }
}

module.exports = { isValidUrl };