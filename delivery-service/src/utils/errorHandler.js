import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error processing request', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message,
    status: 'error'
  });
};