import Joi from 'joi';

// Regular expressions for validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/; // E.164 format: +[country code][number]

// Custom validation function for recipient based on channel
const validateRecipient = (value, helpers) => {
  const { channel } = helpers.state.ancestors[1]; // Get channel from parent object

  if (channel === 'email') {
    if (!EMAIL_REGEX.test(value)) {
      return helpers.error('recipient.invalidEmail');
    }
  } else if (channel === 'sms' || channel === 'whatsapp') {
    if (!PHONE_REGEX.test(value)) {
      return helpers.error('recipient.invalidPhone');
    }
  }

  return value;
};

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
      .custom(validateRecipient)
      .messages({
        'string.base': 'Recipient must be a string',
        'any.required': 'Recipient is required',
        'recipient.invalidEmail': 'Recipient must be a valid email address for email channel',
        'recipient.invalidPhone': 'Recipient must be a valid phone number (E.164 format: +[country code][number]) for SMS/WhatsApp channels'
      }),

    subject: Joi.string()
      .optional()
      .messages({
        'string.base': 'Subject must be a string'
      }),

    body: Joi.string()
      .required()
      .messages({
        'string.base': 'Body must be a string',
        'any.required': 'Body is required'
      })
  }).required()
});