import { Kafka } from 'kafkajs';

export abstract class IKafkaAdapter {
  client!: Kafka;
}
