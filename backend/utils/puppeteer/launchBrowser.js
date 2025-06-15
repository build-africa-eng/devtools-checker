const puppeteer = require('puppeteer-extra'); const StealthPlugin = require('puppeteer-extra-plugin-stealth'); const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker'); const { LAUNCH_ARGS, MOBILE_DEVICES, DESKTOP_USER_AGENTS, NETWORK_CONDITIONS, BLOCKED_HOSTS, } = require('./constants'); const logger = require('../logger'); const path = require('path'); const fs = require('fs');

puppeteer.use(StealthPlugin()); puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function launchBrowserWithRetries({ retries = 3, device = null, userAgent = null, customDevice = null, debug = false, networkProfile = null, blockHosts = true, sessionId = Date.now(), } = {}) { for (let i = 0; i < retries; i++) { let browser; try { browser = await puppeteer.launch({ headless: 'new', args: [...LAUNCH_ARGS, '--no-sandbox', '--disable-setuid-sandbox'], timeout: 120000, executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined, });

const page = await browser.newPage();
  const sessionDir = path.join(__dirname, '../../sessions', String(sessionId));
  fs.mkdirSync(sessionDir, { recursive: true });

  const collectedConsoleLogs = [];
  const collectedRequests = [];

  await page.setViewport({ width: 1280, height: 800 });

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

  if (networkProfile && NETWORK_CONDITIONS[networkProfile]) {
    await page.emulateNetworkConditions(NETWORK_CONDITIONS[networkProfile]);
    debug && logger.info(`Applied network profile: ${networkProfile}`);
  }

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

  page.on('requestfinished', async (req) => {
    const res = req.response();
    if (!res) return;
    collectedRequests.push({
      url: req.url(),
      method: req.method(),
      status: res.status(),
      headers: res.headers(),
    });
    debug && logger.debug(`REQ ${res.status()} ${req.method()} ${req.url()}`);
  });

  page.on('console', async (msg) => {
    const type = msg.type();
    const location = msg.location();
    const entry = {
      type,
      text: msg.text(),
      timestamp: Date.now(),
      args: [],
      url: location?.url || '',
      lineNumber: location?.lineNumber || -1,
      columnNumber: location?.columnNumber || -1,
    };

    try {
      for (const arg of msg.args()) {
        if (arg.asElement()) {
          try {
            entry.args.push(await arg.asElement().outerHTML());
          } catch (e) {
            entry.args.push(`[Element failed to serialize: ${e.message}]`);
          }
        } else {
          try {
            entry.args.push(await arg.jsonValue());
          } catch {
            const stringified = await arg.evaluate(obj => {
              return {
                message: obj.message,
                stack: obj.stack,
                name: obj.name,
              };
            }).catch(() => null);
            entry.args.push(stringified || arg.toString());
          }
        }
      }
      collectedConsoleLogs.push(entry);

      const formattedArgs = entry.args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (type === 'error') {
        logger.error(`Console error: ${formattedArgs} (${entry.url}:${entry.lineNumber})`);
      } else {
        logger.info(`[${type}] ${formattedArgs} (${entry.url}:${entry.lineNumber})`);
      }
    } catch (err) {
      logger.warn(`Console processing error: ${err.message}`);
      collectedConsoleLogs.push({ type, text: msg.text(), timestamp: Date.now(), args: [`Error: ${err.message}`] });
    }
  });

  page.on('pageerror', async (err) => {
    logger.error(`Page error: ${err.message}`);
    collectedConsoleLogs.push({
      type: 'error',
      text: `Page Error: ${err.message}`,
      timestamp: Date.now(),
      args: [{ error: err.message, stack: err.stack }],
    });
    try {
      if (!page.isClosed()) {
        await page.screenshot({ path: path.join(sessionDir, `pageerror-${Date.now()}.png`), fullPage: true });
      }
    } catch {}
  });

  page.on('error', async (err) => {
    logger.error(`Puppeteer error: ${err.message}`);
    collectedConsoleLogs.push({
      type: 'error',
      text: `Unhandled Error: ${err.message}`,
      timestamp: Date.now(),
      args: [{ error: err.message, stack: err.stack }],
    });
    try {
      if (!page.isClosed()) {
        await page.screenshot({ path: path.join(sessionDir, `unhandled-${Date.now()}.png`), fullPage: true });
      }
    } catch {}
  });

  page.on('close', () => {
    try {
      fs.writeFileSync(path.join(sessionDir, 'network-log.json'), JSON.stringify(collectedRequests, null, 2));
      fs.writeFileSync(path.join(sessionDir, 'console-log.json'), JSON.stringify(collectedConsoleLogs, null, 2));
    } catch (e) {
      logger.error(`Failed to write logs: ${e.message}`);
    }
  });

  return { browser, page, sessionDir, collectedConsoleLogs, collectedRequests };
} catch (err) {
  logger.warn(`Retry ${i + 1}/${retries} failed: ${err.message}`);
  if (browser) await browser.close();
  if (i === retries - 1) {
    throw {
      name: 'PuppeteerLaunchError',
      message: `Failed after ${retries} attempts: ${err.message}`,
      details: err.stack,
    };
  }
  await new Promise(r => setTimeout(r, 2000));
}

} }

async function analyzeUrl(url, options) { let browser = null; try { const { browser: b, page, collectedConsoleLogs, collectedRequests } = await launchBrowserWithRetries(options); browser = b; await page.goto(url, { waitUntil: 'networkidle0', timeout: options.navigationTimeout || 60000 });

const title = await page.title();
const html = options.includeHtml ? await page.content() : '';
const screenshot = options.includeScreenshot ? await page.screenshot({ encoding: 'base64', fullPage: true }) : '';

return {
  title,
  html,
  screenshot,
  logs: collectedConsoleLogs,
  requests: collectedRequests,
  error: null,
};

} catch (err) { logger.error(analyzeUrl error for ${url}: ${err.message}); return { error: 'Analysis Failed', message: err.message, details: err.stack || err.details || 'No details', }; } finally { if (browser) await browser.close(); logger.info('Browser closed'); } }

module.exports = { launchBrowserWithRetries, analyzeUrl };

