import { sendToQueue, publishToExchange } from './queue.service.js';
import Message from '../task-router-service/src/models/message.model.js';
import logger from '../task-router-service/src/utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Retry failed messages
export const retryFailedMessages = async () => {
  try {
    // Find messages that need to be retried (status is failed and attempts < 3)
    const messages = await Message.find({
      status: 'failed',
      attempts: { $lt: 3 } // Maximum 3 attempts
    });

    for (const message of messages) {
      logger.info(`Retrying message ${message.id}, attempt ${message.attempts + 1}`);

      // Update message attempt count
      message.attempts += 1;
      message.lastAttempt = new Date();
      message.status = 'Pending'; // Set back to pending
      await message.save();

      // Generate a new trace ID for this retry
      const traceId = uuidv4();

      // Publish message to appropriate queue
      await publishToExchange(
        'message_exchange',
        message.channel,
        {
          id: message.id,
          traceId,
          channel: message.channel,
          content: message.content,
          retryCount: message.attempts,
          timestamp: new Date().toISOString()
        }
      );

      logger.info(`Message ${message.id} republished for retry`, { 
        traceId, 
        messageId: message.id 
      });
    }

    logger.info(`Retried ${messages.length} failed messages`);
  } catch (error) {
    logger.error('Error retrying failed messages:', error);
  }
};

// Start the retry service
export const startRetryService = () => {
  // Run retry check every minute
  const retryInterval = setInterval(retryFailedMessages, 60000);

  logger.info('Message retry service started');

  return retryInterval;
};

// Handle delivery results
export const processDeliveryResults = async () => {
  try {
    await consumeFromQueue('delivery_results', async (message) => {
      const result = JSON.parse(message.content.toString());
      
      // Update message status in database
      await Message.findOneAndUpdate(
        { id: result.messageId },
        { 
          status: result.status,
          $inc: { attempts: 1 },
          lastAttempt: new Date() 
        }
      );

      logger.info(`Updated message ${result.messageId} status to ${result.status}`);
      
      return true;
    });

    logger.info('Delivery results consumer started');
  } catch (error) {
    logger.error('Error starting delivery results consumer:', error);
    throw error;
  }
};