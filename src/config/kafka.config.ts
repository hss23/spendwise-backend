import { registerAs } from '@nestjs/config';

export const kafkaConfig = registerAs('kafka', () => ({
  clientId: 'spendwise-backend',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  groupId: 'spendwise-consumer-group',
  connectionTimeout: 3000,
  authTimeout: 1000,
  reauthenticationThreshold: 10000,
}));
