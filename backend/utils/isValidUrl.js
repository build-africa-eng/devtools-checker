/**
 * Validates URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL format
 */
function isValidUrl(url) {
  try {
    // Create URL object (throws error for invalid formats)
    const parsed = new URL(url);
    
    // Check protocol is HTTP/HTTPS
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (error) {
    return false;
  }
}

module.exports = isValidUrl;