const winston = require('winston');
const { format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(
    ({ timestamp, level, message, requestId, ip }) =>
      `${timestamp} [${level.toUpperCase()}]${requestId ? `[${requestId}]` : ''}${ip ? `[${ip}]` : ''}: ${message}`
  )
);

// Custom format for file output
const fileFormat = format.combine(
  format.timestamp(),
  format.json()
);

// Configure logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    // Console transport
    new transports.Console({
      format: consoleFormat,
    }),
    // Error log file (rotated daily)
    new DailyRotateFile({
      filename: path.join(logDir, 'errors-%DATE%.log'),
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d', // Keep 14 days of logs
      format: fileFormat,
    }),
    // Combined log file (rotated daily)
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      format: fileFormat,
    }),
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join(logDir, 'exceptions.log'),
    }),
  ],
});

// Request-specific logging
logger.request = (req, message, level = 'info', extra = {}) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).slice(2);
  logger[level](message, { requestId, ip, method: req.method, url: req.url, ...extra });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason.stack || reason}`);
});

module.exports = logger;