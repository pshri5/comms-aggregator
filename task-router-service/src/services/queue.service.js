import amqp from 'amqplib';
import config from '../config/config.js';
import logger from '../utils/logger.js';

let connection = null;
let channel = null;

// Initialize RabbitMQ connection and channel
export async function initializeQueue() {
  try {
    // Create connection
    connection = await amqp.connect(config.rabbitmq.uri);

    // Create channel
    channel = await connection.createChannel();

    // Setup exchanges
    await channel.assertExchange(config.rabbitmq.exchanges.messages, 'direct', { durable: true });
    await channel.assertExchange(config.rabbitmq.exchanges.logs, 'topic', { durable: true });

    // Setup queues
    await channel.assertQueue(config.rabbitmq.queues.email, { durable: true });
    await channel.assertQueue(config.rabbitmq.queues.sms, { durable: true });
    await channel.assertQueue(config.rabbitmq.queues.whatsapp, { durable: true });
    await channel.assertQueue(config.rabbitmq.queues.logs, { durable: true });

    // Bind queues to exchanges
    await channel.bindQueue(
      config.rabbitmq.queues.email,
      config.rabbitmq.exchanges.messages,
      'email'
    );
    await channel.bindQueue(
      config.rabbitmq.queues.sms,
      config.rabbitmq.exchanges.messages,
      'sms'
    );
    await channel.bindQueue(
      config.rabbitmq.queues.whatsapp,
      config.rabbitmq.exchanges.messages,
      'whatsapp'
    );
    await channel.bindQueue(
      config.rabbitmq.queues.logs,
      config.rabbitmq.exchanges.logs,
      'logs.#'
    );

    // Setup reconnection
    connection.on('close', () => {
      logger.error('RabbitMQ connection closed, attempting to reconnect...');
      setTimeout(initializeQueue, 5000);
    });

    logger.info('RabbitMQ initialized successfully');

    return { connection, channel };
  } catch (error) {
    logger.error('Failed to initialize RabbitMQ', { error: error.message });

    // Attempt to reconnect
    setTimeout(initializeQueue, 5000);
    throw error;
  }
}

// Publish message to a specific exchange and routing key
export async function publishToChannel(exchange, routingKey, message) {
  try {
    if (!channel) {
      throw new Error('Channel not initialized');
    }

    const success = channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    if (!success) {
      throw new Error('Failed to publish message to RabbitMQ');
    }

    return true;
  } catch (error) {
    logger.error('Error publishing to RabbitMQ', {
      error: error.message,
      exchange,
      routingKey
    });
    throw error;
  }
}

// Publish log message
export async function publishLog(logData) {
  try {
    const routingKey = `logs.${logData.level || 'info'}`;

    await publishToChannel(
      config.rabbitmq.exchanges.logs,
      routingKey,
      {
        service: 'task-router',
        timestamp: new Date().toISOString(),
        ...logData
      }
    );

    return true;
  } catch (error) {
    // Don't throw error for logging failures to avoid cascading failures
    console.error('Failed to publish log:', error);
    return false;
  }
}