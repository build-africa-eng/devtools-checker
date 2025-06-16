const fs = require('fs');
const path = require('path');

/**
 * Saves a combined HTML report with screenshot and results embedded.
 * @param {object} options
 * @param {string} options.title - Title of the report.
 * @param {string} options.outputDir - Directory to save the report in.
 * @param {object} options.data - JSON results (violations or audits).
 * @param {string} options.screenshotPath - Path to the PNG screenshot.
 * @param {string} [options.filename] - Optional override filename.
 */
function saveCombinedReport({ title, outputDir, data, screenshotPath, filename = null }) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = filename || `${title.toLowerCase().replace(/\s+/g, '-')}-report-${timestamp}.html`;

  const screenshotBase64 = fs.readFileSync(screenshotPath).toString('base64');
  const screenshotTag = `<img src="data:image/png;base64,${screenshotBase64}" style="max-width: 100%; border: 1px solid #ccc;" />`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} Report</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; }
    pre { background: #f9f9f9; padding: 1rem; border: 1px solid #ccc; overflow-x: auto; }
    h2 { margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>${title} Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <h2>Screenshot</h2>
  ${screenshotTag}
  <h2>Audit Data</h2>
  <pre>${JSON.stringify(data, null, 2)}</pre>
</body>
</html>`.trim();

  const outputPath = path.join(outputDir, reportFile);
  fs.writeFileSync(outputPath, html, 'utf-8');
  return outputPath;
}

module.exports = { saveCombinedReport };