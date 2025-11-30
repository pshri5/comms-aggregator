import logger from '../task-router-service/src/utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Response object
  const response = {
    success: false,
    error: statusCode === 500 ? 'Internal server error' : err.message
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  // Send response
  res.status(statusCode).json(response);
};