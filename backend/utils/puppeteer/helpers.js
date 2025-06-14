const fs = require('fs').promises;
const logger = require('../logger');
const { compressToBase64 } = require('./compression');

async function captureTouchAndGestureEvents(page) {
  if (!page) {
    logger.error('Invalid page instance for capturing touch and gesture events');
    return;
  }
  await page.evaluate(() => {
    document.addEventListener('touchstart', (e) => {
      console.log('Touch event:', JSON.stringify({
        touches: Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY })),
        timestamp: Date.now(),
      }));
    });
    document.addEventListener('gesturestart', (e) => {
      console.log('Gesture event:', JSON.stringify({
        scale: e.scale,
        rotation: e.rotation,
        timestamp: Date.now(),
      }));
    });
  }).catch(() => {});
}

async function captureHtml(page, debug = false) {
  if (!page) {
    logger.error('Invalid page instance for capturing HTML');
    return null;
  }
  const html = await Promise.race([
    page.content(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('HTML capture timed out')), 10000)),
  ]);
  const compressed = await compressToBase64(html);
  if (debug) logger.info('Captured and compressed HTML');
  return compressed;
}

async function captureScreenshot(page, debug = false) {
  if (!page) {
    logger.error('Invalid page instance for capturing screenshot');
    return null;
  }
  const ss = await Promise.race([
    page.screenshot({ encoding: 'binary', fullPage: true }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Screenshot capture timed out')), 10000)),
  ]);
  const compressed = await compressToBase64(ss);
  if (debug) logger.info('Captured and compressed screenshot');
  return compressed;
}

async function captureMobileMetrics(page, debug = false) {
  if (!page) {
    logger.error('Invalid page instance for capturing mobile metrics');
    return null;
  }
  const metrics = await Promise.race([
    page.evaluate(() => ({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      orientation: screen.orientation?.type || 'unknown',
      memory: performance.memory ? {
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        usedJSHeapSize: performance.memory.usedJSHeapSize,
      } : null,
    })),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Metrics capture timed out')), 5000)),
  ]);
  if (debug) logger.info('Captured mobile metrics');
  return metrics;
}

async function getDomMetrics(page, debug = false) {
  if (!page) {
    logger.error('Invalid page instance for capturing DOM metrics');
    return null;
  }
  const metrics = await Promise.race([
    page.evaluate(() => {
      function getNodeCount(node = document) {
        let count = 1;
        if (node.children) {
          Array.from(node.children).forEach(child => {
            count += getNodeCount(child);
          });
        }
        return count;
      }

      function getMaxDepth(node = document, depth = 0) {
        let maxDepth = depth;
        if (node.children) {
          Array.from(node.children).forEach(child => {
            maxDepth = Math.max(maxDepth, getMaxDepth(child, depth + 1));
          });
        }
        return maxDepth;
      }

      return {
        nodeCount: getNodeCount(),
        maxDepth: getMaxDepth(),
        hasLargeDom: getNodeCount() > 1500, // Arbitrary threshold for large DOM
      };
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('DOM metrics capture timed out')), 5000)),
  ]);
  if (debug) logger.info('Captured DOM metrics');
  return metrics;
}

async function inspectElement(page, selector, debug = false) {
  if (!page) {
    logger.error('Invalid page instance for inspecting element');
    return null;
  }
  const element = await Promise.race([
    page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? {
        outerHTML: el.outerHTML,
        attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value])),
        boundingBox: el.getBoundingClientRect().toJSON(),
      } : null;
    }, selector),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Element inspection timed out')), 5000)),
  ]);
  if (debug) logger.info(`Inspected element: ${selector}`);
  return element;
}

async function executeScript(page, script, debug = false) {
  if (!page) {
    logger.error('Invalid page instance for executing script');
    return { error: 'Invalid page instance' };
  }
  try {
    const result = await Promise.race([
      page.evaluate(script),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Script execution timed out')), 5000)),
    ]);
    if (debug) logger.info('Executed custom script');
    return result;
  } catch (err) {
    logger.error(`Script execution failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = {
  captureTouchAndGestureEvents,
  captureHtml,
  captureScreenshot,
  captureMobileMetrics,
  getDomMetrics, // New function
  inspectElement,
  executeScript,
};