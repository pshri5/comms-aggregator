import { consumeFromQueue } from './queue.service.js';
import { indexLog, searchLogs, getClient } from '../db/elasticsearch.js';
import logger from '../utils/logger.js';

// Process a log message from the queue
export const processLogMessage = async (message) => {
  try {
    const logData = JSON.parse(message.content.toString());

    // Add additional metadata
    logData.processedAt = new Date().toISOString();

    // Console log for development visibility
    console.log(`[${logData.service}][${logData.level}] ${logData.message} `);

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

// Get logs by trace ID
export const getLogsByTraceId = async (traceId) => {
  const query = {
    match: {
      traceId: traceId
    }
  };
  return await searchLogs(query);
};

// Get log statistics
export const getLogStats = async () => {
  try {
    const client = getClient();

    const result = await client.search({
      index: 'service-logs',
      size: 0,
      body: {
        aggs: {
          levels: {
            terms: { field: 'level' }
          },
          services: {
            terms: { field: 'service' }
          }
        }
      }
    });

    return {
      total: result.hits.total.value,
      levels: result.aggregations.levels.buckets,
      services: result.aggregations.services.buckets
    };
  } catch (error) {
    logger.error('Failed to get log stats', error);
    throw error;
  }
};