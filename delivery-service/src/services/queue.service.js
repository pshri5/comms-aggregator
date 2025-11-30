import amqplib from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

let connection = null;
let channel = null;

// Initialize RabbitMQ connection and channels
export const initializeQueue = async () => {
  try {
    // Connect to RabbitMQ
    connection = await amqplib.connect(process.env.RABBITMQ_URI || 'amqp://localhost');
    channel = await connection.createChannel();
    
    // Create exchange
    await channel.assertExchange('message_exchange', 'direct', { durable: true });
    
    // Create queues
    await channel.assertQueue('email_queue', { durable: true });
    await channel.assertQueue('sms_queue', { durable: true });
    await channel.assertQueue('whatsapp_queue', { durable: true });
    await channel.assertQueue('delivery_results', { durable: true });
    await channel.assertQueue('logs_queue', { durable: true });
    
    // Bind queues to exchange
    await channel.bindQueue('email_queue', 'message_exchange', 'email');
    await channel.bindQueue('sms_queue', 'message_exchange', 'sms');
    await channel.bindQueue('whatsapp_queue', 'message_exchange', 'whatsapp');
    await channel.bindQueue('logs_queue', 'message_exchange', 'logs');
    
    return { connection, channel };
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
    throw error;
  }
};

// Get the channel (create if not exists)
export const getChannel = async () => {
  if (!channel) {
    await initializeQueue();
  }
  return channel;
};

// Send a message to a queue
export const sendToQueue = async (queueName, message) => {
  try {
    const ch = await getChannel();
    return ch.sendToQueue(
      queueName, 
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (error) {
    console.error(`Failed to send to queue ${queueName}:`, error);
    throw error;
  }
};

// Publish a message to an exchange with routing key
export const publishToExchange = async (exchange, routingKey, message) => {
  try {
    const ch = await getChannel();
    return ch.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (error) {
    console.error(`Failed to publish to exchange ${exchange}:`, error);
    throw error;
  }
};

// Consume messages from a queue
export const consumeFromQueue = async (queueName, callback) => {
  try {
    const ch = await getChannel();
    
    await ch.prefetch(1); // Process one message at a time
    
    await ch.consume(queueName, async (message) => {
      if (message !== null) {
        try {
          // Process the message with the callback
          const success = await callback(message);
          
          if (success) {
            // Acknowledge the message if processing was successful
            ch.ack(message);
          } else {
            // Reject the message without requeuing if processing failed
            ch.reject(message, false);
          }
        } catch (error) {
          console.error(`Error processing message from ${queueName}:`, error);
          // Reject the message without requeuing
          ch.reject(message, false);
        }
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Failed to consume from queue ${queueName}:`, error);
    throw error;
  }
};

// Close connections
export const closeConnections = async () => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    console.log('RabbitMQ connections closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connections:', error);
  }
};