import express from 'express';
import { searchLogsController, getTraceLogsController, getStatsController } from '../controllers/logs.controllers.js';

const router = express.Router();

router.get('/search', searchLogsController);
router.get('/trace/:traceId', getTraceLogsController);
router.get('/stats', getStatsController);

export default router;