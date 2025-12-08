import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db/dbConfig.js';
import messageRoutes from './routes/message.route.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { initializeQueue } from './services/queue.service.js';
import logger from './utils/logger.js';
import { startRetryService } from './services/message.service.js';


// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'task-router' });
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

    // Start the retry service
    startRetryService();
    logger.info('Retry service started');

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Task Router Service running on port ${PORT}`);
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