import { Client } from '@elastic/elasticsearch';
import logger from '../utils/logger.js';

let client;

export const connectElasticsearch = async () => {
  try {
    client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });

    // Test the connection
    const info = await client.info();
    logger.info(`Elasticsearch connected: ${info.name}`);

    // Create index if it doesn't exist
    const indexExists = await client.indices.exists({
      index: 'service-logs'
    });

    if (!indexExists) {
      await client.indices.create({
        index: 'service-logs',
        body: {
          mappings: {
            properties: {
              service: { type: 'keyword' },
              timestamp: { type: 'date' },
              traceId: { type: 'keyword' },
              level: { type: 'keyword' },
              message: { type: 'text' },
              data: { type: 'object', enabled: true }
            }
          }
        }
      });
      logger.info('Created service-logs index');
    }

    return client;
  } catch (error) {
    logger.error('Elasticsearch connection error', error);
    throw error;
  }
};

export const getClient = () => {
  if (!client) {
    throw new Error('Elasticsearch client not initialized');
  }
  return client;
};

export const indexLog = async (logData) => {
  try {
    const client = getClient();

    await client.index({
      index: 'service-logs',
      body: {
        ...logData,
        '@timestamp': logData.timestamp || new Date().toISOString()
      }
    });

    return true;
  } catch (error) {
    logger.error('Failed to index log in Elasticsearch', {
      error: error.message,
      logData
    });
    return false;
  }
};

export const searchLogs = async (query, from = 0, size = 50) => {
  try {
    const client = getClient();

    const result = await client.search({
      index: 'service-logs',
      body: {
        from,
        size,
        sort: [{ '@timestamp': { order: 'desc' } }],
        query: query
      }
    });

    return result.hits.hits.map(hit => hit._source);
  } catch (error) {
    logger.error('Failed to search logs in Elasticsearch', {
      error: error.message,
      query
    });
    throw error;
  }
};