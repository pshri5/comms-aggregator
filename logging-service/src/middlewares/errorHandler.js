import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    logger.error(err.message, { stack: err.stack });

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Server Error'
    });
};
