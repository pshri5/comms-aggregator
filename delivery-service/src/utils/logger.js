import winston from 'winston';
import { publishLog } from '../services/queue.service.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'delivery-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Extend logger to also send to RabbitMQ
const originalLoggerMethods = {
  info: logger.info,
  warn: logger.warn,
  error: logger.error,
  debug: logger.debug
};

// Override logger methods to also publish to RabbitMQ
['info', 'warn', 'error', 'debug'].forEach(level => {
  logger[level] = function (message, meta = {}) {
    // Call original logger method
    originalLoggerMethods[level].call(logger, message, meta);

    // Also publish to RabbitMQ
    try {
      publishLog({
        level,
        message,
        ...meta
      }).catch(err => {
        console.error('Failed to publish log to RabbitMQ:', err);
      });
    } catch (error) {
      console.error('Error sending log to queue:', error);
    }
  };
});

export default logger;