export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/promo-service',
  },
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || 'promo-service',
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    consumer: {
      groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'promo-service-group',
    },
  },
  app: {
    name: 'promo-service',
    version: '1.0.0',
    description: 'Микросервис промокодов',
  },
  validation: {
    minPromoCodeLength: 3,
    maxPromoCodeLength: 50,
    maxDescriptionLength: 500,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
}); 