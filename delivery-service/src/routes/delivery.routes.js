import { Router } from 'express';
import { getDelivery, getDeliveries, getStats } from '../controllers/delivery.controller.js';

const router = Router();

// GET routes
router.get('/stats', getStats);
router.get('/:id', getDelivery);
router.get('/', getDeliveries);

export default router;