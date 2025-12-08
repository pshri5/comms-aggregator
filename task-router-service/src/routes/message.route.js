import express from 'express';
import { createMessage, getMessage } from '../controllers/message.controller.js';
import { validateMessage } from '../middlewares/validator.js';

const router = express.Router();

// POST /api/messages - Create a new message
router.post('/', validateMessage, createMessage);

// GET /api/messages/:id - Get message by ID
router.get('/:id', getMessage);

export default router;