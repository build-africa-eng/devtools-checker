const puppeteer = require('puppeteer');

async function analyzeUrl(url) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const logs = [];
  const requests = [];

  // Capture console logs
  page.on('console', (msg) => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });

  // Capture network requests
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    requests.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
      status: null,
    });
    req.continue();
  });
  page.on('response', (res) => {
    const req = requests.find((r) => r.url === res.url());
    if (req) req.status = res.status();
  });

  // Navigate to URL
  await page.goto(url, { waitUntil: 'networkidle2' });

  await browser.close();
  return { logs, requests };
}

module.exports = { analyzeUrl };