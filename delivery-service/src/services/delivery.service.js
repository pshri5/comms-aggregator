import { v4 as uuidv4 } from 'uuid';
import Delivery from '../models/delivery.model.js';
import { consumeFromQueue, sendToQueue, getChannel } from './queue.service.js';
import logger from '../utils/logger.js';

// Simulate sending a message through a specific channel
const simulateDelivery = async (channel, messageData) => {
  logger.info(`Simulating ${channel} delivery`, { 
    messageId: messageData.id,
    recipient: messageData.content.recipient 
  });

  // Simulate success/failure (80% success rate)
  const isSuccessful = Math.random() > 0.2;

  // Introduce a small delay to simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  if (!isSuccessful) {
    throw new Error(`Failed to deliver ${channel} message`);
  }

  return true;
};

// Process a message from a queue
export const processMessage = async (queueMessage) => {
  const messageData = JSON.parse(queueMessage.content.toString());
  const { id, channel, content, traceId } = messageData;
  const deliveryId = uuidv4();
  
  logger.info(`Processing ${channel} message`, {
    traceId,
    messageId: id,
    deliveryId
  });

  try {
    // Create a delivery record
    const delivery = await Delivery.create({
      messageId: id,
      traceId,
      channel,
      content,
      status: 'pending'
    });

    // Attempt delivery
    await simulateDelivery(channel, messageData);

    // Update delivery record on success
    await Delivery.findByIdAndUpdate(delivery._id, {
      status: 'delivered',
      deliveredAt: new Date()
    });

    // Send result back to task router
    await sendToQueue('delivery_results', {
      messageId: id,
      traceId,
      status: 'delivered',
      deliveryId,
      timestamp: new Date().toISOString()
    });

    logger.info(`Successfully delivered ${channel} message`, {
      traceId,
      messageId: id,
      deliveryId
    });

    return true;
  } catch (error) {
    logger.error(`Failed to deliver ${channel} message: ${error.message}`, {
      traceId,
      messageId: id,
      deliveryId
    });

    // Update delivery record on failure
    await Delivery.findOneAndUpdate(
      { messageId: id },
      {
        status: 'failed',
        error: error.message
      },
      { upsert: true }
    );

    // Send failure result back to task router
    await sendToQueue('delivery_results', {
      messageId: id,
      traceId,
      status: 'failed',
      error: error.message,
      deliveryId,
      timestamp: new Date().toISOString()
    });

    return false;
  }
};

// Start consumers for each channel
export const startDeliveryConsumers = async () => {
  // Consume from email queue
  await consumeFromQueue('email_queue', async (message) => {
    const success = await processMessage(message);
    return success; // Will acknowledge if true, reject if false
  });

  // Consume from sms queue
  await consumeFromQueue('sms_queue', async (message) => {
    const success = await processMessage(message);
    return success;
  });

  // Consume from whatsapp queue
  await consumeFromQueue('whatsapp_queue', async (message) => {
    const success = await processMessage(message);
    return success;
  });

  logger.info('All delivery consumers started successfully');
};

// Get delivery by message ID
export const getDeliveryByMessageId = async (messageId) => {
  return await Delivery.findOne({ messageId });
};

// Get deliveries by status
export const getDeliveriesByStatus = async (status) => {
  return await Delivery.find({ status });
};