import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db/dbConfig.js';
import deliveryRoutes from './routes/delivery.routes.js';
import { errorHandler } from './utils/errorHandler.js';
import { initializeQueue } from './services/queue.service.js';
import logger from './utils/logger.js';
import { startDeliveryConsumers } from './services/delivery.service.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/deliveries', deliveryRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'delivery-service' });
});

// Error handling middleware
app.use(errorHandler);

// Initialize the app
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('Connected to MongoDB');

    // Initialize RabbitMQ connections
    await initializeQueue();
    logger.info('Connected to RabbitMQ');

    // Start message consumers
    await startDeliveryConsumers();
    logger.info('Message consumers started');

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Delivery Service running on port ${PORT}`);
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