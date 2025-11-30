import winston from 'winston';
import { publishLog } from '../services/queue.service.js';

// Define custom format
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'task-router' },
  transports: [
    new winston.transports.Console(),
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
  logger[level] = function(message, meta = {}) {
    // Call original logger method
    originalLoggerMethods[level].call(logger, message, meta);
    
    // Also publish to RabbitMQ if possible
    try {
      publishLog({
        level,
        message,
        ...meta
      }).catch(err => {
        // Just log to console if RabbitMQ publish fails
        console.error('Failed to publish log to RabbitMQ:', err);
      });
    } catch (error) {
      // Fallback if queue service is not initialized yet
      console.error('Error sending log to queue:', error);
    }
  };
});

export default logger;