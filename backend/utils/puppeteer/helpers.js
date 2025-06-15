const fs = require('fs').promises;
const logger = require('../logger');
const { compressToBase64 } = require('./compression');

/**
 * Wraps a promise with a timeout.
 */
function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

/**
 * Attaches touch and gesture event logging to the page's console.
 */
async function captureTouchAndGestureEvents(page) {
  if (!page) return logger.warn('Page instance is null - skipping touch/gesture capture');

  try {
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
    });
  } catch {
    logger.warn('Failed to inject touch/gesture event listeners');
  }
}

/**
 * Captures and compresses page HTML.
 */
async function captureHtml(page, debug = false) {
  if (!page) return logger.warn('Page instance is null - skipping HTML capture'), null;

  const html = await withTimeout(
    page.content(),
    120000,
    'HTML capture timed out'
  );
  const compressed = await compressToBase64(html);
  debug && logger.info('Captured and compressed HTML');
  return compressed;
}

/**
 * Captures and compresses a full-page screenshot.
 */
async function captureScreenshot(page, debug = false) {
  if (!page) return logger.warn('Page instance is null - skipping screenshot'), null;

  const buffer = await withTimeout(
    page.screenshot({ encoding: 'binary', fullPage: true }),
    120000,
    'Screenshot capture timed out'
  );
  const compressed = await compressToBase64(buffer);
  debug && logger.info('Captured and compressed screenshot');
  return compressed;
}

/**
 * Captures mobile-specific metrics from the page.
 */
async function captureMobileMetrics(page, debug = false) {
  if (!page) return logger.warn('Page instance is null - skipping mobile metrics'), null;

  const metrics = await withTimeout(
    page.evaluate(() => ({
      viewport: { width: window.innerWidth, height: window.innerHeight },
      orientation: screen.orientation?.type || 'unknown',
      memory: performance.memory ? {
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        usedJSHeapSize: performance.memory.usedJSHeapSize,
      } : null,
    })),
    10000,
    'Mobile metrics capture timed out'
  );
  debug && logger.info('Captured mobile metrics');
  return metrics;
}

/**
 * Retrieves DOM size, depth, and element breakdown.
 */
async function getDomMetrics(page, debug = false) {
  if (!page) return logger.warn('Page instance is null - skipping DOM metrics'), null;

  const metrics = await withTimeout(
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

      function getElementBreakdown() {
        const breakdown = {};
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
        let node = walker.nextNode();
        while (node) {
          const tag = node.tagName.toLowerCase();
          breakdown[tag] = (breakdown[tag] || 0) + 1;
          node = walker.nextNode();
        }
        return breakdown;
      }

      return {
        nodeCount: getNodeCount(),
        maxDepth: getMaxDepth(),
        hasLargeDom: getNodeCount() > 1500,
        elementBreakdown: getElementBreakdown(),
      };
    }),
    10000,
    'DOM metrics capture timed out'
  );
  debug && logger.info('Captured DOM metrics');
  return metrics;
}

/**
 * Extracts attributes, bounding box, and outerHTML of a selector.
 */
async function inspectElement(page, selector, debug = false) {
  if (!page) return logger.warn('Page instance is null - skipping element inspection'), null;

  const element = await withTimeout(
    page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? {
        outerHTML: el.outerHTML,
        attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value])),
        boundingBox: el.getBoundingClientRect().toJSON(),
      } : null;
    }, selector),
    5000,
    'Element inspection timed out'
  );
  debug && logger.info(`Inspected element: ${selector}`);
  return element;
}

/**
 * Executes custom JavaScript in the page context.
 */
async function executeScript(page, script, debug = false) {
  if (!page) return logger.warn('Page instance is null - skipping script execution'), { error: 'No page' };

  try {
    const result = await withTimeout(
      page.evaluate(script),
      10000,
      'Script execution timed out'
    );
    debug && logger.info('Executed custom script');
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
  getDomMetrics,
  inspectElement,
  executeScript,
};