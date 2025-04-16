import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { IKafkaAdapter } from '../kafka/adapter';
import { IConsumerAdapter } from './adapter';
import { Consumer } from 'kafkajs';
import { name } from '../../../package.json';

@Injectable()
export class ConsumerService implements IConsumerAdapter, OnModuleDestroy {
  consumer!: Consumer;

  constructor(
    kafka: IKafkaAdapter,
  ) {
    this.consumer = kafka.client.consumer({ groupId: name, allowAutoTopicCreation: true, sessionTimeout: 90000, heartbeatInterval: 30000 });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect()
  }
}