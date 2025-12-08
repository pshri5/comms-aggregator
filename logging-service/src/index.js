import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeQueue } from './services/queue.service.js';
import logger from './utils/logger.js';
import { startLogConsumer } from './services/log.service.js';
import { connectElasticsearch } from './db/elasticsearch.js';
import logsRoutes from './routes/logs.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/logs', logsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'logging-service' });
});

// Error handling middleware
app.use(errorHandler);

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

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Logging Service running on port ${PORT}`);
    });
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