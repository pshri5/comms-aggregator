import amqplib from 'amqplib';
import logger from '../utils/logger.js';
import { processLog } from './logs.service.js';

let connection;
let channel;

export const initializeQueue = async () => {
  try {
    // Connect to RabbitMQ
    connection = await amqplib.connect(process.env.RABBITMQ_URI || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Ensure log queue exists
    await channel.assertExchange('message_exchange', 'direct', { durable: true });
    await channel.assertQueue('logs_queue', { durable: true });
    await channel.bindQueue('logs_queue', 'message_exchange', 'logs');
    
    // Set prefetch to avoid overwhelming the service
    channel.prefetch(10);
    
    // Start consuming logs
    startLogConsumer();
    
    return { connection, channel };
  } catch (error) {
    logger.error('RabbitMQ connection error', error);
    throw error;
  }
};

const startLogConsumer = () => {
  channel.consume('logs_queue', async (msg) => {
    if (msg) {
      try {
        const logData = JSON.parse(msg.content.toString());
        await processLog(logData);
        channel.ack(msg);
      } catch (error) {
        logger.error(`Error processing log message: ${error.message}`);
        // If processing fails, nack without requeue
        channel.reject(msg, false);
      }
    }
  });
  
  logger.info('Log consumer started');
};

// Cleanup function
export const closeConnection = async () => {
  if (channel) await channel.close();
  if (connection) await connection.close();
};