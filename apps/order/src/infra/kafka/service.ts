import { Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { IKafkaAdapter } from './adapter';

@Injectable()
export class KafkaService implements IKafkaAdapter {
  client: Kafka;

  constructor(kafka: Kafka) {
    this.client = kafka;
  }
}
