import { consumeFromQueue } from '../../../services/queue.service.js';
import { indexLog } from '../db/elasticsearch.js';
import logger from '../utils/logger.js';

// Process a log message from the queue
export const processLogMessage = async (message) => {
  try {
    const logData = JSON.parse(message.content.toString());
    
    // Add additional metadata
    logData.processedAt = new Date().toISOString();
    
    // Console log for development visibility
    console.log(`[${logData.service}][${logData.level}] ${logData.message}`);
    
    // Index in Elasticsearch
    await indexLog(logData);
    
    return true;
  } catch (error) {
    logger.error('Error processing log message', { error: error.message });
    return false; // Message will be rejected
  }
};

// Start the log consumer
export const startLogConsumer = async () => {
  await consumeFromQueue('logs_queue', processLogMessage);
  logger.info('Log consumer started');
};