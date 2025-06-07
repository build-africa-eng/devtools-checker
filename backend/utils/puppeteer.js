const puppeteer = require('puppeteer');

async function analyzeUrl(url) {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.NODE_ENV === 'production' ? '/usr/bin/chromium' : null,
    });
    const page = await browser.newPage();
    const logs = [];
    const requests = [];

    page.on('console', (msg) => {
      logs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
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

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await browser.close();
    return { logs, requests };
  } catch (error) {
    console.error('Puppeteer error:', error);
    throw error;
  }
}

module.exports = { analyzeUrl };