// Puppeteer launch arguments
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

// Custom mobile device emulation profiles
const MOBILE_DEVICES = {
  'iPhone 12': {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    viewport: {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  },
  'Samsung Galaxy S20': {
    userAgent:
      'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
    viewport: {
      width: 360,
      height: 800,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  },
};

// Desktop user agent strings
const DESKTOP_USER_AGENTS = {
  'Windows Chrome':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Windows Firefox':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mac Safari':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15',
  'Linux Edge':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
};

// Custom network throttling profiles (in bytes/ms)
const NETWORK_CONDITIONS = {
  'Fast 4G': {
    downloadThroughput: (9 * 1024 * 1024) / 8, // 9Mbps
    uploadThroughput: (1.5 * 1024 * 1024) / 8, // 1.5Mbps
    latency: 20,
  },
  'Slow 3G': {
    downloadThroughput: (500 * 1024) / 8, // 500Kbps
    uploadThroughput: (500 * 1024) / 8,
    latency: 400,
  },
  Offline: {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  },
};

// Domains to block (ads, analytics, tracking)
const BLOCKED_HOSTS = [
  'doubleclick.net',
  'google-analytics.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'adservice.google.com',
  'facebook.net',
  'facebook.com',
];

module.exports = {
  LAUNCH_ARGS,
  MOBILE_DEVICES,
  DESKTOP_USER_AGENTS,
  NETWORK_CONDITIONS,
  BLOCKED_HOSTS,
};