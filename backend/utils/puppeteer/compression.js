// utils/compression.js
const { promisify } = require('util');
const zlib = require('zlib');

const deflate = promisify(zlib.deflate);

async function compressToBase64(data) {
  const compressed = await deflate(data);
  return compressed.toString('base64');
}

module.exports = { compressToBase64 };