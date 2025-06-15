const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const {
  LAUNCH_ARGS,
  MOBILE_DEVICES,
  DESKTOP_USER_AGENTS,
  NETWORK_CONDITIONS,
  BLOCKED_HOSTS,
} = require('./constants'); // Assuming constants are in a separate file
const logger = require('../logger'); // Assuming a logger utility exists
const path = require('path');
const fs = require('fs');

// Apply Puppeteer plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

/**
 * Launches a Puppeteer browser with retry logic and enhanced configuration.
 * @param {object} options - The launch options.
 * @param {number} [options.retries=3] - The number of times to retry launching the browser.
 * @param {string|null} [options.device=null] - The name of a mobile device to emulate from MOBILE_DEVICES.
 * @param {string|null} [options.userAgent=null] - The name of a desktop user agent to apply from DESKTOP_USER_AGENTS.
 * @param {object|null} [options.customDevice=null] - A custom Puppeteer device descriptor to emulate.
 * @param {boolean} [options.debug=false] - Whether to enable detailed logging.
 * @param {string|null} [options.networkProfile=null] - A network condition profile to emulate.
 * @param {boolean} [options.blockHosts=true] - Whether to block requests to known tracking/ad hosts.
 * @param {string|number} [options.sessionId=Date.now()] - A unique ID for the session to store logs and screenshots.
 * @returns {Promise<{browser: import('puppeteer').Browser, page: import('puppeteer').Page, sessionDir: string, collectedConsoleLogs: Array<object>, collectedRequests: Array<object>}>} // <-- MODIFIED: Added return types
 */
async function launchBrowserWithRetries({
  retries = 3,
  device = null,
  userAgent = null,
  customDevice = null,
  debug = false,
  networkProfile = null,
  blockHosts = true,
  sessionId = Date.now(),
} = {}) {
  for (let i = 0; i < retries; i++) {
    let browser;
    try {
      // <-- MODIFIED: Increased Puppeteer launch timeout to 2 minutes
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
            ...LAUNCH_ARGS,
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
        timeout: 120000, // 120 seconds = 2 minutes
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      });

      const page = await browser.newPage();
      const sessionDir = path.join(__dirname, '../../sessions', String(sessionId));
      fs.mkdirSync(sessionDir, { recursive: true });

      // <-- NEW: Arrays to collect console logs and network requests
      const collectedConsoleLogs = [];
      const collectedRequests = [];

      // ========== SET VIEWPORT ==========
      await page.setViewport({ width: 1280, height: 800 });


      // ========== DEVICE/UA EMULATION ==========
      if (customDevice) {
        await page.emulate(customDevice);
        debug && logger.info(`Using custom device profile`);
      } else if (device && MOBILE_DEVICES[device]) {
        await page.emulate(MOBILE_DEVICES[device]);
        debug && logger.info(`Emulated mobile device: ${device}`);
      } else if (userAgent && DESKTOP_USER_AGENTS[userAgent]) {
        await page.setUserAgent(DESKTOP_USER_AGENTS[userAgent]);
        debug && logger.info(`Applied desktop user agent: ${userAgent}`);
      }

      // ========== NETWORK EMULATION ==========
      if (networkProfile && NETWORK_CONDITIONS[networkProfile]) {
        await page.emulateNetworkConditions(NETWORK_CONDITIONS[networkProfile]);
        debug && logger.info(`Applied network profile: ${networkProfile}`);
      }

      // ========== BLOCK REQUESTS ==========
      if (blockHosts) {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const url = req.url();
          if (BLOCKED_HOSTS.some(host => url.includes(host))) {
            debug && logger.info(`Blocked request: ${url}`);
            return req.abort();
          }
          return req.continue();
        });
      }

      // ========== REQUEST/RESPONSE LOGGING (Collects into collectedRequests) ==========
      page.on('requestfinished', async (req) => {
        const res = req.response();
        if (!res) return;
        const entry = {
          url: req.url(),
          method: req.method(),
          status: res.status(),
          headers: res.headers(),
          // Add body/response if needed and configured in options
        };
        collectedRequests.push(entry); // <-- Collect here
        debug && logger.debug(`REQ ${entry.status} ${entry.method} ${entry.url}`);
      });

      // ========== JS CONSOLE LOGGING (ENHANCED for JSHandle@error) ==========
      page.on('console', async (msg) => {
        const type = msg.type(); // e.g., 'log', 'error', 'warn', 'info', 'debug'
        const location = msg.location(); // Get source location
        const messageEntry = {
          type: type,
          text: msg.text(), // Raw text of the console message (useful fallback)
          timestamp: Date.now(),
          args: [], // Processed arguments
          url: location?.url || '',
          lineNumber: location?.lineNumber || -1,
          columnNumber: location?.columnNumber || -1,
        };

        try {
          for (const arg of msg.args()) {
            if (arg.asElement()) { // Check if it's an element handle (e.g., console.log(document.body))
              try {
                messageEntry.args.push(await arg.asElement().outerHTML());
              } catch (e) {
                messageEntry.args.push(`[Element failed to serialize: ${e.message}]`);
              }
            } else {
              try {
                // Attempt to get the JSON value for primitives and simple objects
                const jsonVal = await arg.jsonValue();
                messageEntry.args.push(jsonVal);
              } catch (jsonErr) {
                // If jsonValue() fails, it might be a complex object or an Error object.
                // Try to get its string representation or specific properties.
                const argString = arg.toString(); // e.g., "JSHandle@error"
                if (argString.includes('JSHandle@object') || argString.includes('JSHandle@error')) {
                  // Attempt to evaluate properties of the JSHandle directly in the page context
                  const errorProps = await arg.evaluate(obj => {
                    const props = {
                      message: obj.message,
                      stack: obj.stack,
                      name: obj.name,
                      // Add other error properties if needed, e.g., code, errno
                    };
                    // Filter out undefined/null properties for cleaner output
                    return Object.fromEntries(Object.entries(props).filter(([, v]) => v != null));
                  }).catch(() => null); // Catch if evaluation fails (e.g., handle is gone)

                  if (errorProps && (errorProps.message || errorProps.stack)) {
                    // We got specific error properties!
                    messageEntry.args.push({ error: errorProps.message, stack: errorProps.stack, name: errorProps.name });
                  } else {
                    // Fallback for other complex JSHandles if specific properties couldn't be extracted
                    messageEntry.args.push(argString);
                  }
                } else {
                  // Fallback for any other JSHandle that jsonValue failed on (less common)
                  messageEntry.args.push(argString);
                }
              }
            }
          }
          collectedConsoleLogs.push(messageEntry); // <-- Collect the processed message here

          // Keep your server-side logger calls if you want them in your backend logs too
          const formattedArgs = messageEntry.args.map(a => typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)).join(' ');
          if (type === 'error') {
            logger.error(`Console error from page: ${formattedArgs} (at ${messageEntry.url}:${messageEntry.lineNumber})`);
          } else {
            logger.info(`[${type}] Console from page: ${formattedArgs} (at ${messageEntry.url}:${messageEntry.lineNumber})`);
          }

        } catch (argProcessingErr) {
          logger.warn(`Error processing console argument for logging: ${argProcessingErr.message}. Raw message: ${msg.text()}`);
          collectedConsoleLogs.push({ type: type, text: msg.text(), timestamp: Date.now(), args: [`Failed to process: ${argProcessingErr.message}`] });
        }
      });

      // ========== PAGE ERROR HANDLING (unhandled exceptions in page context) ==========
      page.on('pageerror', async (err) => {
        logger.error(`Page unhandled error: ${err.message}. Stack: ${err.stack}`);
        // Also add to collected logs for frontend display
        collectedConsoleLogs.push({
          type: 'error',
          text: `Page Unhandled Error: ${err.message}`,
          timestamp: Date.now(),
          args: [{ error: err.message, stack: err.stack, name: err.name || 'Error' }],
          url: err.url || '', // `err` object often has url/line/column for pageerror
          lineNumber: err.lineNumber || -1,
          columnNumber: err.columnNumber || -1,
        });
        const screenshotPath = path.join(sessionDir, `pageerror-${Date.now()}.png`);
        try {
          if (!page.isClosed()) {
            await page.screenshot({ path: screenshotPath, fullPage: true });
            logger.error(`Saved full page screenshot: ${screenshotPath}`);
          } else {
            logger.warn('Cannot capture screenshot on pageerror, page already closed.');
          }
        } catch (screenshotErr) {
          logger.error(`Screenshot failed on pageerror: ${screenshotErr.message}`);
        }
      });

      // ========== UNCAUGHT EXCEPTION HANDLING (from Puppeteer process itself) ==========
      page.on('error', async (err) => {
          logger.error(`Unhandled exception in Puppeteer page process: ${err.message}`);
          collectedConsoleLogs.push({ // Also collect for frontend display
            type: 'error',
            text: `Puppeteer Process Error: ${err.message}`,
            timestamp: Date.now(),
            args: [{ error: err.message, stack: err.stack, name: err.name || 'Error' }],
            url: '', lineNumber: -1, columnNumber: -1, // No specific page location here
          });
          const screenshotPath = path.join(sessionDir, `uncaught-exception-${Date.now()}.png`);
          try {
              if (!page.isClosed()) {
                  await page.screenshot({ path: screenshotPath, fullPage: true });
                  logger.error(`Saved full page screenshot: ${screenshotPath}`);
              } else {
                  logger.warn('Cannot capture screenshot on uncaught exception, page already closed.');
              }
          } catch (screenshotErr) {
              logger.error(`Screenshot failed on uncaught exception: ${screenshotErr.message}`);
          }
      });


      // ========== SAVE LOGS ON CLOSE (This is for backend internal saving, frontend gets via return) ==========
      page.on('close', () => {
        try {
          fs.writeFileSync(
            path.join(sessionDir, 'network-log.json'),
            JSON.stringify(collectedRequests, null, 2) // Use collectedRequests
          );
          fs.writeFileSync( // Save console logs too
            path.join(sessionDir, 'console-log.json'),
            JSON.stringify(collectedConsoleLogs, null, 2)
          );
        } catch (writeErr) {
          logger.error(`Failed to write session logs: ${writeErr.message}`);
        }
      });

      // <-- MODIFIED: Return collected logs and requests
      return { browser, page, sessionDir, collectedConsoleLogs, collectedRequests };

    } catch (err) {
      logger.warn(`Launch attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (browser) await browser.close(); // Ensure browser is closed on failure
      // <-- MODIFIED: Throw a more detailed error object on final failure
      if (i === retries - 1) {
        throw {
          name: 'PuppeteerLaunchError',
          message: `Failed to launch browser after ${retries} attempts: ${err.message}`,
          details: err.stack,
        };
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

// Dummy analyzeUrl function (YOU NEED TO IMPLEMENT THIS if it's separate)
// This function should call launchBrowserWithRetries and process its results.
// For example:
async function analyzeUrl(url, options) {
  let browser = null;
  try {
    const { browser: launchedBrowser, page, collectedConsoleLogs, collectedRequests } = await launchBrowserWithRetries(options);
    browser = launchedBrowser; // Assign to outer scope for finally block
    await page.goto(url, { waitUntil: 'networkidle0', timeout: options.navigationTimeout || 60000 });

    // Perform your analysis here:
    const title = await page.title();
    const html = options.includeHtml ? await page.content() : '';
    const screenshot = options.includeScreenshot ? await page.screenshot({ encoding: 'base64', fullPage: true }) : '';
    // ... calculate other metrics (DOM, performance, etc.)

    return {
      title,
      html,
      screenshot,
      logs: collectedConsoleLogs, // <-- Pass collected logs
      requests: collectedRequests, // <-- Pass collected requests
      // ... other analysis results
      error: null, // No error on success
    };
  } catch (err) {
    logger.error(`Error in analyzeUrl for ${url}: ${err.message}. Details: ${err.stack}`);
    // <-- MODIFIED: Return a structured error for frontend
    return {
      error: 'Analysis Failed',
      message: err.message, // The message from PuppeteerLaunchError or other
      details: err.stack || (err.details ? err.details : 'No stack/details available'),
    };
  } finally {
    if (browser) {
      await browser.close();
      logger.info('Browser closed.');
    }
  }
}


module.exports = { launchBrowserWithRetries, analyzeUrl }; // <-- MODIFIED: Export analyzeUrl