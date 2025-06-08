const winston = require('winston');
const { format, transports } = winston;
const path = require('path');

// Create logs directory path
const logDir = path.join(__dirname, '../logs');

// Custom format for console output
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(
    info => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Custom format for file output
const fileFormat = format.combine(
  format.timestamp(),
  format.json()
);

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  transports: [
    // Console transport
    new transports.Console({
      format: consoleFormat
    }),
    
    // Error log file
    new transports.File({
      filename: path.join(logDir, 'errors.log'),
      level: 'error',
      format: fileFormat
    }),
    
    // Combined log file
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: fileFormat
    })
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ]
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason.stack || reason}`);
});

module.exports = logger;