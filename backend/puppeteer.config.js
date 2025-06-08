module.exports = {
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--single-process',
  ],
  headless: true,
  timeout: 60000,
  ignoreHTTPSErrors: true,

  launch: {
    handleSIGINT: false,
    handleSIGTERM: false,
    handleSIGHUP: false,
  },
};