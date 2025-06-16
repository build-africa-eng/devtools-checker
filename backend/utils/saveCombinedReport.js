const fs = require('fs');
const path = require('path');

/**
 * Generates a simple HTML report that includes a screenshot and summary JSON.
 * @param {Object} params
 * @param {string} params.title - Report title (e.g., 'Lighthouse', 'Accessibility')
 * @param {string} params.outputDir - Where to save the report
 * @param {object} params.data - Summary JSON data
 * @param {string} params.screenshotPath - Path to PNG screenshot
 * @returns {string} Full path to saved HTML file
 */
function saveCombinedReport({ title, outputDir, data, screenshotPath }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${title.toLowerCase()}-report-${timestamp}.html`;
  const filepath = path.join(outputDir, filename);

  const relativeScreenshot = path.basename(screenshotPath);
  const escapedJSON = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} Report</title>
  <style>
    body { font-family: sans-serif; padding: 2em; }
    h1 { color: #333; }
    pre { background: #f5f5f5; padding: 1em; overflow: auto; }
    img { max-width: 100%; border: 1px solid #ccc; margin-top: 1em; }
  </style>
</head>
<body>
  <h1>${title} Report - ${new Date().toLocaleString()}</h1>
  <h2>Screenshot</h2>
  <img src="./${relativeScreenshot}" alt="Screenshot" />
  <h2>JSON Summary</h2>
  <pre><code>${escapedJSON}</code></pre>
</body>
</html>`;

  fs.writeFileSync(filepath, html, 'utf-8');
  return filepath;
}

module.exports = { saveCombinedReport };