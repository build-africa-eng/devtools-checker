const winston = require('winston');
const { format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    const metaInfo = Object.entries(meta)
      .map(([key, val]) => `${key}=${val}`)
      .join(' ');
    return `${timestamp} [${level}]: ${message}${metaInfo ? ` | ${metaInfo}` : ''}`;
  })
);

const fileFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    new transports.Console({ format: consoleFormat }),
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      format: fileFormat,
    }),
    new DailyRotateFile({
      filename: path.join(logDir, 'errors-%DATE%.log'),
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      format: fileFormat,
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(logDir, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logDir, 'rejections.log') }),
  ],
});

logger.request = (req, message, level = 'info', extra = {}) => {
  const ip =
    req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(2);
  logger.log(level, message, {
    requestId,
    ip,
    method: req.method,
    url: req.originalUrl || req.url,
    ...extra,
  });
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', { reason: reason?.stack || reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err?.stack || err });
});

module.exports = logger;