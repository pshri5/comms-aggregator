import Joi from 'joi';

// Validation schema for message creation
export const messageSchema = Joi.object({
  channel: Joi.string()
    .valid('email', 'sms', 'whatsapp')
    .required()
    .messages({
      'string.base': 'Channel must be a string',
      'any.required': 'Channel is required',
      'any.only': 'Channel must be one of: email, sms, whatsapp'
    }),
  
  content: Joi.object({
    recipient: Joi.string()
      .required()
      .messages({
        'string.base': 'Recipient must be a string',
        'any.required': 'Recipient is required'
      }),
    
    subject: Joi
  })
})