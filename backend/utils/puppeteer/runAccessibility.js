const fs = require('fs');
const path = require('path');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const logger = require('../logger');
const { OPEN } = require('ws');

/**
 * Runs an accessibility audit using axe-core/puppeteer.
 * @param {import('puppeteer').Page} page - Puppeteer page instance.
 * @param {object} options
 * @param {boolean} [options.debug=false]
 * @param {WebSocket.Server|null} [options.wsServer=null]
 * @param {string|null} [options.outputDir=null] - Directory to save results (JSON).
 * @returns {Promise<object>} AXE results with a summary and violations.
 */
async function runAccessibility(page, {
  debug = false,
  wsServer = null,
  outputDir = null
} = {}) {
  try {
    if (!page) throw new Error('Invalid page instance');

    const axe = new AxePuppeteer(page);

    const results = await Promise.race([
      axe.analyze(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Accessibility audit timed out')), 60000)
      ),
    ]);

    const { violations = [] } = results;

    const summary = {
      totalViolations: violations.length,
      impactedNodes: violations.reduce((acc, v) => acc + (v.nodes?.length || 0), 0),
      rules: violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length
      }))
    };

    if (debug) {
      logger.info(`Accessibility audit completed with ${violations.length} violations`);
    }

    // Send via WebSocket
    if (wsServer) {
      wsServer.clients.forEach(client => {
        if (client.readyState === OPEN) {
          client.send(JSON.stringify({ type: 'accessibility', data: summary }));
        }
      });
    }

    // Save to disk
    if (outputDir) {
      const outPath = path.join(outputDir, 'axe-results.json');
      fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
      if (debug) logger.info(`Accessibility report saved to ${outPath}`);
    }

    return { summary, violations };
  } catch (err) {
    logger.error(`Accessibility audit failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { runAccessibility };