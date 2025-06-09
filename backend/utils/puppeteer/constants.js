// Launch arguments for Puppeteer
const LAUNCH_ARGS = [
  '--remote-debugging-port=9222',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--single-process',
  '--disable-gpu',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-client-side-phishing-detection',
  '--disable-default-apps',
  '--disable-hang-monitor',
  '--disable-popup-blocking',
  '--disable-prompt-on-repost',
  '--disable-sync',
  '--metrics-recording-only',
  '--safebrowsing-disable-auto-update',
  '--enable-automation',
  '--disable-infobars',
  '--disable-breakpad',
  '--disable-extensions',
  '--disable-features=TranslateUI',
  '--disable-component-update',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-ipc-flooding-protection',
  '--disable-back-forward-cache',
  '--disable-notifications',
];

// Device profiles
const MOBILE_DEVICES = {
  'iPhone 12': {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  },
  'Samsung Galaxy S20': {
    userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
    viewport: { width: 360, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  },
};

// Network profiles
const NETWORK_CONDITIONS = {
  'Fast 4G': { downloadThroughput: 9 * 1024 * 1024 / 8, uploadThroughput: 1.5 * 1024 * 1024 / 8, latency: 20 },
  'Slow 3G': { downloadThroughput: 500 * 1024 / 8, uploadThroughput: 500 * 1024 / 8, latency: 400 },
  'Offline': { downloadThroughput: 0, uploadThroughput: 0, latency: 0 },
};

// Blocked hosts
const BLOCKED_HOSTS = [
  'doubleclick.net',
  'google-analytics.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'adservice.google.com',
  'facebook.net',
  'facebook.com',
];

module.exports = { LAUNCH_ARGS, MOBILE_DEVICES, NETWORK_CONDITIONS, BLOCKED_HOSTS };