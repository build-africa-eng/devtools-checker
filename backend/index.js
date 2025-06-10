const express = require('express');
const cors = require('cors');
const { logger } = require('./utils/logger');
const analyzeRouter = require('./routes/analyze');

const app = express();
app.set('trust proxy', 1); // Trust Render's first proxy

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? 'https://devtools-checker.pages.dev'
    : 'http://localhost:5173',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Log middleware
app.use((req, res, next) => {
  logger.info(`Incoming ${req.method} request to ${req.originalUrl} from IP ${req.ip}`);
  next();
});

app.use(express.json({ limit: '10mb' }));

// Pass WebSocket URL from env to router via app locals
app.locals.webSocketUrl = process.env.WEBSOCKET_URL || null;

// Routes
app.use('/api/analyze', analyzeRouter);

// Root endpoint
app.get('/', (req, res) => {
  logger.info('GET /');
  res.json({ message: 'DevTools Checker Backend - Use POST /api/analyze to analyze URLs' });
});

// API info endpoint
app.get('/api/analyze', (req, res) => {
  logger.info('GET /api/analyze');
  res.json({
    message: 'Use POST /api/analyze with a JSON body { "url": "https://example.com", "options": {...} }',
    supportedOptions: [
      'device', 'customDevice', 'includeHtml', 'includeScreenshot', 'includeLighthouse', 'includeAccessibility',
      'includePerformanceTrace', 'captureStacks', 'captureHeaders', 'captureResponseBodies', 'maxBodySize', 'maxLogs',
      'maxRequests', 'onlyImportantLogs', 'navigationTimeout', 'networkConditionsType', 'inspectElement',
      'filterRequestTypes', 'filterDomains', 'executeScript', 'debug', 'enableWebSocket', 'cpuThrottlingRate',
      'followLinks', 'maxLinks', 'requestTimeout', 'outputDir',
    ],
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('GET /health');
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error in ${req.method} ${req.originalUrl}: ${err.stack || err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});