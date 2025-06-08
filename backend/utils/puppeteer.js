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

  // Map console message types to expected levels
  const typeToLevel = {
    error: 'error',
    warning: 'warn',
    info: 'info',
    log: 'log',
  };

  page.on('console', (msg) => {
    logs.push({
      level: typeToLevel[msg.type()] || 'log', // Map type to level
      message: msg.text(), // Use text as message
      location: msg.location(),
    });
  });

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    requests.push({
      url: req.url(),
      method: req.method(),
      type: req.resourceType(), // Map resourceType to type
      status: null,
      startTime: Date.now(), // Record start time
    });
    req.continue();
  });

  page.on('response', (res) => {
    const req = requests.find((r) => r.url === res.url());
    if (req) {
      req.status = res.status();
      req.time = Date.now() - req.startTime; // Calculate duration
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  } catch (error) {
    console.error('Page navigation failed:', error.message);
  }

  await browser.close();

  return { logs, requests };
}

module.exports = { analyzeUrl };