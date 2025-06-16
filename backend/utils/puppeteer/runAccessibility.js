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
 * @param {string|null} [options.outputDir=null] - Directory to save results.
 * @param {string} [options.minImpact=null] - Minimum impact level to include (e.g., 'moderate').
 * @returns {Promise<object>} AXE results with a summary and violations.
 */
async function runAccessibility(page, {
  debug = false,
  wsServer = null,
  outputDir = null,
  minImpact = null,
} = {}) {
  try {
    if (!page) throw new Error('Invalid page instance');

    const axe = new AxePuppeteer(page);
    const results = await Promise.race([
      axe.analyze(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Accessibility audit timed out')), 300000)
      ),
    ]);

    let { violations = [] } = results;

    // Filter by min impact if specified
    if (minImpact) {
      const levels = ['minor', 'moderate', 'serious', 'critical'];
      const minIndex = levels.indexOf(minImpact);
      if (minIndex >= 0) {
        violations = violations.filter(v => levels.indexOf(v.impact) >= minIndex);
      }
    }

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

    // WebSocket broadcast
    if (wsServer) {
      wsServer.clients.forEach(client => {
        if (client.readyState === OPEN) {
          client.send(JSON.stringify({ type: 'accessibility', data: summary }));
        }
      });
    }

    // Save to disk
    if (outputDir) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.writeFileSync(path.join(outputDir, `axe-results-${timestamp}.json`), JSON.stringify(results, null, 2), 'utf-8');
      fs.writeFileSync(path.join(outputDir, `axe-summary-${timestamp}.json`), JSON.stringify(summary, null, 2), 'utf-8');
      if (debug) logger.info(`Accessibility reports saved to ${outputDir}`);
    }

    return { summary, violations };
  } catch (err) {
    logger.error(`Accessibility audit failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { runAccessibility };