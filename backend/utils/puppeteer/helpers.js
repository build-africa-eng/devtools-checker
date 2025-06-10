const { promisify } = require('util');
const zlib = require('zlib');
const fs = require('fs').promises;
const deflate = promisify(zlib.deflate);
const { logger } = require('../utils/logger');

async function captureTouchAndGestureEvents(page) {
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
}

async function captureHtml(page, debug = false) {
  const html = await page.content();
  const compressed = (await deflate(html)).toString('base64');
  if (debug) logger('info', 'Captured and compressed HTML');
  return compressed;
}

async function captureScreenshot(page, outputDir, debug = false) {
  const ss = await page.screenshot({ encoding: 'binary', fullPage: true });
  const compressed = (await deflate(ss)).toString('base64');
  if (debug) logger('info', 'Captured and compressed screenshot');
  return compressed;
}

async function captureMobileMetrics(page, debug = false) {
  const metrics = await page.evaluate(() => ({
    viewport: { width: window.innerWidth, height: window.innerHeight },
    orientation: screen.orientation ? screen.orientation.type : 'unknown',
    memory: performance.memory ? {
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      usedJSHeapSize: performance.memory.usedJSHeapSize,
    } : null,
  }));
  if (debug) logger('info', 'Captured mobile metrics');
  return metrics;
}

async function inspectElement(page, selector, debug = false) {
  const element = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? {
      outerHTML: el.outerHTML,
      attributes: Object.fromEntries([...el.attributes].map(a => [a.name, a.value])),
      boundingBox: el.getBoundingClientRect().toJSON(),
    } : null;
  }, selector);
  if (debug) logger('info', `Inspected element: ${selector}`);
  return element;
}

async function executeScript(page, script, debug = false) {
  try {
    const result = await page.evaluate(script);
    if (debug) logger('info', 'Executed custom script');
    return result;
  } catch (err) {
    logger('error', `Script execution failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { captureTouchAndGestureEvents, captureHtml, captureScreenshot, captureMobileMetrics, inspectElement, executeScript };