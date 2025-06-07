// playwright.config.cjs
module.exports = {
  testDir: 'tests',
  testMatch: /.*\.spec\.js/,
  workers: 1, // Run tests sequentially (good for debugging)
  timeout: 30000, // 30 seconds timeout
  reporter: 'html',
  use: {
    headless: false, // Run with a browser window
  },
  projects: [
    {
      name: 'Chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
};