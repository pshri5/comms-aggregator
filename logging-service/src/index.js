// logging-service/src/index.js
import dotenv from 'dotenv';
import { initializeQueue } from '../../services/queue.service.js';
import logger from './utils/logger.js';
import { startLogConsumer } from './services/log.service.js';
import { connectElasticsearch } from './db/elasticsearch.js';

// Load environment variables
dotenv.config();

// Initialize the app
async function startServer() {
  try {
    // Connect to Elasticsearch
    await connectElasticsearch();
    logger.info('Connected to Elasticsearch');

    // Initialize RabbitMQ connections
    await initializeQueue();
    logger.info('Connected to RabbitMQ');

    // Start log consumers
    await startLogConsumer();
    logger.info('Log consumer started');

    logger.info('Logging Service started successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});