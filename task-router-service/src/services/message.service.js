import { v4 as uuidv4 } from 'uuid';
import Message from '../models/message.model.js';
import { publishToChannel } from './queue.service.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';

// Process and route a new message
export async function processMessage(messageData) {
  const { channel, content, traceId } = messageData;

  try {
    // Check for duplicate messages (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingMessage = await Message.findOne({
      'content.recipient': content.recipient,
      'content.body': content.body,
      channel: channel,
      createdAt: { $gt: fiveMinutesAgo }
    });

    if (existingMessage) {
      logger.info('Duplicate message detected', { 
        traceId, 
        messageId: existingMessage.id 
      });
      
      return existingMessage;
    }

    // Create a new message
    const messageId = uuidv4();
    const message = new Message({
      id: messageId,
      traceId,
      channel,
      content,
      status: 'pending'
    });

    await message.save();
    logger.info('Message saved to database', { 
      traceId, 
      messageId, 
      channel 
    });

    // Publish to the appropriate queue
    await publishMessage(message);

    return message;
  } catch (error) {
    logger.error('Error processing message', { 
      traceId, 
      error: error.message 
    });
    throw error;
  }
}

// Publish message to RabbitMQ
export async function publishMessage(message) {
  try {
    const { id, traceId, channel, content } = message;

    // Prepare message for queue
    const queueMessage = {
      id,
      traceId,
      channel,
      content,
      timestamp: new Date().toISOString()
    };

    // Publish to appropriate channel queue
    await publishToChannel(
      config.rabbitmq.exchanges.messages,
      channel, // routing key
      queueMessage
    );

    logger.info('Message published to queue', { 
      traceId, 
      messageId: id, 
      channel, 
      queue: `${channel}_queue` 
    });

    return true;
  } catch (error) {
    logger.error('Error publishing message to queue', { 
      traceId: message.traceId, 
      messageId: message.id, 
      error: error.message 
    });
    throw error;
  }
}

// Get message by ID
export async function getMessageById(id) {
  return Message.findOne({ id });
}

// Process failed messages for retry
export async function processRetries() {
  try {
    const { maxAttempts } = config.retryConfig;
    
    // Find messages to retry (failed status, attempts < max)
    const messagesToRetry = await Message.find({
      status: 'failed',
      attempts: { $lt: maxAttempts }
    });

    logger.info(`Found ${messagesToRetry.length} messages to retry`);

    for (const message of messagesToRetry) {
      // Increment attempt counter
      message.attempts += 1;
      message.status = 'pending';
      message.lastAttempt = new Date();

      // Save updated message
      await message.save();

      // Republish message
      await publishMessage(message);

      logger.info('Retrying failed message', {
        messageId: message.id,
        channel: message.channel,
        attempt: message.attempts
      });
    }

    return messagesToRetry.length;
  } catch (error) {
    logger.error('Error processing retries', { error: error.message });
    throw error;
  }
}

// Start the retry service
export function startRetryService() {
  const { checkInterval } = config.retryConfig;
  
  // Setup interval to check for failed messages
  setInterval(async () => {
    try {
      await processRetries();
    } catch (error) {
      logger.error('Retry service error', { error: error.message });
    }
  }, checkInterval);
  
  logger.info(`Retry service started, checking every ${checkInterval}ms`);
}