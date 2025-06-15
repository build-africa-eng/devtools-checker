const { URL } = require('url');
const fs = require('fs').promises;
const { BLOCKED_HOSTS } = require('./constants');
const logger = require('../logger');

async function setupNetworkCapture(page, options, wsServer) {
  const {
    captureHeaders = false,
    captureResponseBodies = false,
    maxBodySize = 10240,
    maxRequests = 500,
    filterRequestTypes = ['document', 'xhr', 'fetch', 'script'],
    filterDomains = [],
    requestTimeout = 100000,
    outputDir = './analysis',
    enableWebSocket = false,
  } = options;

  const requests = [];
  const requestMap = new WeakMap();

  // Validate page instance
  if (!page) throw new Error('Invalid page instance');

  await page.setRequestInterception(true).catch(() => {});
  page.on('request', async (req) => {
    const urlObj = new URL(req.url());
    const type = req.resourceType();

    if (
      BLOCKED_HOSTS.some(host => urlObj.hostname.includes(host)) ||
      (filterRequestTypes.length && !filterRequestTypes.includes(type)) ||
      (filterDomains.length && !filterDomains.some(d => urlObj.hostname.includes(d))) ||
      requests.length >= maxRequests
    ) {
      return req.abort().catch(() => {});
    }

    const requestData = {
      id: requests.length + 1,
      url: req.url(),
      method: req.method(),
      type,
      priority: req.priority?.(),
      status: null,
      errorText: null,
      startTime: process.hrtime.bigint(),
      size: 0,
      requestHeaders: captureHeaders ? req.headers() : {},
      responseHeaders: {},
      responseBody: null,
    };

    const timeout = setTimeout(() => req.abort('net::ERR_TIMED_OUT').catch(() => {}), requestTimeout);
    requests.push(requestData);
    requestMap.set(req, { data: requestData, timeout });
    req.continue().catch(() => {});
  });

  page.on('response', async (res) => {
    const req = res.request();
    const entry = requestMap.get(req);
    if (!entry) return;
    const { data: requestData, timeout } = entry;

    clearTimeout(timeout);
    try {
      requestData.status = res.status();
      requestData.timing = res.timing?.();
      requestData.protocol = res.protocol?.();
      requestData.securityState = res.securityState?.();
      requestData.securityDetails = res.securityDetails?.();
      if (captureHeaders) requestData.responseHeaders = res.headers();

      if (captureResponseBodies) {
        const type = res.headers()['content-type'] || '';
        if (/text|json|javascript/.test(type)) {
          const buf = await Promise.race([
            res.buffer(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Response buffer timed out')), 10000)
            ),
          ]);
          requestData.size = buf.length;
          if (buf.length <= maxBodySize) {
            requestData.responseBody = buf.toString('utf8');
          } else {
            const filePath = `${outputDir}/response-${requestData.id}.txt`;
            await fs.writeFile(filePath, buf);
            requestData.responseBody = `[Saved to ${filePath}]`;
          }
        } else {
          requestData.responseBody = '[Non-text response]';
        }
      }
    } catch (err) {
      requestData.errorText = err.message;
    }

    if (enableWebSocket && wsServer) {
      wsServer.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'request', data: requestData }));
        }
      });
    }
  });

  return {
    requests,
    networkWaterfall: () =>
      requests
        .map(r => ({
          url: r.url,
          start: Number(r.startTime) / 1e6,
          duration: r.timing?.total || 0,
          status: r.status,
        }))
        .sort((a, b) => a.start - b.start),
  };
}

module.exports = { setupNetworkCapture };