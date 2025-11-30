import Log from '../models/log.model.js';
import logger from '../utils/logger.js';
import { indexLog } from './elasticsearch.service.js';

export const processLog = async (logData) => {
  try {
    // Normalize the log data
    const normalizedLog = {
      service: logData.service,
      level: logData.level || 'info',
      message: logData.message,
      traceId: logData.traceId,
      data: logData.data || {},
      timestamp: logData.timestamp ? new Date(logData.timestamp) : new Date()
    };
    
    // Store in MongoDB for backup and internal use
    const log = new Log(normalizedLog);
    await log.save();
    
    // Index in Elasticsearch for searching and visualization
    await indexLog(normalizedLog);
    
    logger.debug(`Log processed: ${normalizedLog.message}`, { 
      service: normalizedLog.service,
      traceId: normalizedLog.traceId
    });
    
    return log;
  } catch (error) {
    logger.error(`Error processing log: ${error.message}`);
    throw error;
  }
};

export const getLogsByTraceId = async (traceId) => {
  try {
    return await Log.find({ traceId }).sort({ timestamp: 1 });
  } catch (error) {
    logger.error(`Error fetching logs by traceId: ${error.message}`);
    throw error;
  }
};

export const getLogStats = async () => {
  try {
    const stats = await Log.aggregate([
      {
        $group: {
          _id: {
            service: '$service',
            level: '$level'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.service',
          levels: {
            $push: {
              level: '$_id.level',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      }
    ]);
    
    return stats;
  } catch (error) {
    logger.error(`Error getting log stats: ${error.message}`);
    throw error;
  }
};