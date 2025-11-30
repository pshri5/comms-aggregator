import { Client } from '@elastic/elasticsearch';
import logger from '../utils/logger.js';

let client;

export const connectElasticsearch = async () => {
  try {
    client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    });
    
    // Check connection
    await client.ping();
    logger.info('Elasticsearch connected!');
    
    // Check if index exists, create if not
    const indexExists = await client.indices.exists({
      index: 'service-logs'
    });
    
    if (!indexExists) {
      await createLogsIndex();
    }
    
    return client;
  } catch (error) {
    logger.error('Elasticsearch connection error', error);
    throw error;
  }
};

const createLogsIndex = async () => {
  try {
    await client.indices.create({
      index: 'service-logs',
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1
        },
        mappings: {
          properties: {
            service: { type: 'keyword' },
            level: { type: 'keyword' },
            traceId: { type: 'keyword' },
            message: { type: 'text' },
            data: { type: 'object', enabled: true },
            timestamp: { type: 'date' }
          }
        }
      }
    });
    
    logger.info('Created service-logs index in Elasticsearch');
  } catch (error) {
    logger.error('Error creating Elasticsearch index', error);
    throw error;
  }
};

export const indexLog = async (logData) => {
  try {
    await client.index({
      index: 'service-logs',
      body: {
        ...logData,
        '@timestamp': new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error indexing log in Elasticsearch', error);
    throw error;
  }
};

export const searchLogs = async (query) => {
  try {
    const { service, level, traceId, from, size, startDate, endDate } = query;
    
    const searchQuery = {
      bool: {
        must: []
      }
    };
    
    if (service) {
      searchQuery.bool.must.push({ match: { service } });
    }
    
    if (level) {
      searchQuery.bool.must.push({ match: { level } });
    }
    
    if (traceId) {
      searchQuery.bool.must.push({ match: { traceId } });
    }
    
    // Add date range if provided
    if (startDate || endDate) {
      const range = { timestamp: {} };
      
      if (startDate) range.timestamp.gte = startDate;
      if (endDate) range.timestamp.lte = endDate;
      
      searchQuery.bool.must.push({ range });
    }
    
    const result = await client.search({
      index: 'service-logs',
      body: {
        query: searchQuery,
        sort: [{ timestamp: { order: 'desc' } }],
        from: from || 0,
        size: size || 50
      }
    });
    
    return result.body.hits;
  } catch (error) {
    logger.error('Error searching logs in Elasticsearch', error);
    throw error;
  }
};