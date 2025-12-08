import { getLogsByTraceId, getLogStats } from '../services/log.service.js';
import { searchLogs } from '../db/elasticsearch.js';
import logger from '../utils/logger.js';

export const searchLogsController = async (req, res, next) => {
  try {
    const query = req.query;
    const result = await searchLogs(query);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error searching logs: ${error.message}`);
    next(error);
  }
};

export const getTraceLogsController = async (req, res, next) => {
  try {
    const { traceId } = req.params;

    const logs = await getLogsByTraceId(traceId);

    if (!logs || logs.length === 0) {
      return res.status(404).json({ error: 'No logs found for this trace ID' });
    }

    return res.status(200).json(logs);
  } catch (error) {
    logger.error(`Error fetching trace logs: ${error.message}`);
    next(error);
  }
};

export const getStatsController = async (req, res, next) => {
  try {
    const stats = await getLogStats();
    return res.status(200).json(stats);
  } catch (error) {
    logger.error(`Error fetching log stats: ${error.message}`);
    next(error);
  }
};