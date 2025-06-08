const puppeteer = require('puppeteer');

async function analyzeUrl(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
    ],
    timeout: 60000,
  });

  const page = await browser.newPage();
  const logs = [];
  const requests = [];

  page.on('console', (msg) => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
      important: ['error', 'warning'].includes(msg.type()),
    });
  });

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

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await browser.close();

  return { logs, requests };
}

module.exports = { analyzeUrl };