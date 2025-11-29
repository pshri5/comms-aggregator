export default {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/task-router'
  },
  rabbitmq: {
    uri: process.env.RABBITMQ_URI || 'amqp://localhost',
    exchanges: {
      messages: 'message_exchange',
      logs: 'logs_exchange'
    },
    queues: {
      email: 'email_queue',
      sms: 'sms_queue',
      whatsapp: 'whatsapp_queue',
      logs: 'logs_queue'
    }
  },
  retryConfig: {
    maxAttempts: 3,
    checkInterval: 30000, // 30 seconds
    initialBackoff: 5000  // 5 seconds
  }
};