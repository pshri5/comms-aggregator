import { v4 as uuidv4 } from 'uuid';
import { processMessage, getMessageById } from '../services/message.service.js';
import logger from '../utils/logger.js';

export const createMessage = async (req, res, next) => {
  try {
    const traceId = uuidv4();
    logger.info('Received new message request', { traceId, ip: req.ip });

    // Create message from request body
    const messageData = {
      ...req.body,
      traceId
    };

    // Process the message
    const result = await processMessage(messageData);

    // Return response
    res.status(201).json({
      success: true,
      messageId: result.id,
      status: result.status
    });
  } catch (error) {
    next(error);
  }
};

export const getMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const traceId = uuidv4();

    logger.info('Retrieving message status', { traceId, messageId: id });

    const message = await getMessageById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      message
    });
  } catch (error) {
    next(error);
  }
};