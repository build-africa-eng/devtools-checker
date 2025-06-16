const fs = require('fs');
const path = require('path');
const { AxePuppeteer } = require('@axe-core/puppeteer');
const logger = require('../logger');
const { OPEN } = require('ws');
const { saveCombinedReport } = require('../utils/saveCombinedReport');

/**
 * Runs an accessibility audit using axe-core/puppeteer.
 * @param {import('puppeteer').Page} page
 * @param {object} options
 * @param {boolean} [options.debug=false]
 * @param {WebSocket.Server|null} [options.wsServer=null]
 * @param {string|null} [options.outputDir=null]
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
        setTimeout(() => reject(new Error('Accessibility audit timed out')), 300000)
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

    // WebSocket push
    if (wsServer) {
      wsServer.clients.forEach(client => {
        if (client.readyState === OPEN) {
          client.send(JSON.stringify({ type: 'accessibility', data: summary }));
        }
      });
    }

    // Save results
    if (outputDir) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const jsonPath = path.join(outputDir, `axe-results-${timestamp}.json`);
      const screenshotPath = path.join(outputDir, `axe-screenshot-${timestamp}.png`);

      fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf-8');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const htmlPath = saveCombinedReport({
        title: 'Accessibility',
        outputDir,
        data: summary,
        screenshotPath
      });

      if (debug) {
        logger.info(`Accessibility JSON saved to ${jsonPath}`);
        logger.info(`Screenshot saved to ${screenshotPath}`);
        logger.info(`Combined HTML report saved to ${htmlPath}`);
      }
    }

    return { summary, violations };
  } catch (err) {
    logger.error(`Accessibility audit failed: ${err.message}`);
    return { error: err.message };
  }
}

module.exports = { runAccessibility };