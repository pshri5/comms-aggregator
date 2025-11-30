import { messageSchema } from '../utils/validation.js';

export const validateMessage = (req, res, next) => {
  const { error } = messageSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  next();
};