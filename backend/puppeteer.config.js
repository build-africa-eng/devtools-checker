module.exports = {
  // Define the executable path or connect to a remote browser
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, // Set via env variable or null for remote
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--single-process',
  ],
  headless: true,
  timeout: 60000, // 60 seconds timeout
  ignoreHTTPSErrors: true, // Handle HTTPS issues if any
  // Optional: Use Browserless for remote execution
  browserWSEndpoint: process.env.BROWSERLESS_WSS_URL || null, // e.g., 'wss://chrome.browserless.io?token=YOUR_API_TOKEN'

  // Custom launch options
  launch: {
    // Override default launch behavior if needed
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
  },