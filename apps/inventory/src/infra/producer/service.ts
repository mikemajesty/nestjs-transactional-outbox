import { Injectable, OnModuleDestroy } from '@nestjs/common';

import { ErrorType, ILoggerAdapter } from '@/infra/logger';

import { IKafkaAdapter } from '../kafka/adapter';
import { IProducerAdapter } from './adapter';
import { Producer, ProducerRecord } from 'kafkajs';

@Injectable()
export class ProducerService implements IProducerAdapter, OnModuleDestroy {
  producer!: Producer;

  constructor(
    kafka: IKafkaAdapter,
    private readonly logger: ILoggerAdapter,
  ) {
    this.producer = kafka.client.producer({
      idempotent: true,
      allowAutoTopicCreation: true,
      retry: {
        maxRetryTime: 30000,
        initialRetryTime: 100,
        retries: 5,
        factor: 2,
      },
    });
  }

  async onModuleDestroy() {
    await this.producer.disconnect()
  }

  async onModuleInit() {
    await this.producer.connect()
  }

  async publish(payload: ProducerRecord): Promise<void> {
    const context = `Payment/${ProducerService.name}`;

    this.logger.info({
      message: `sending to ${payload.topic}`,
    });
    try {
      await this.producer.send(payload)
    } catch (error: ErrorType) {
      error.parameters = {
        topic: payload.topic,
        context,
        payload,
      };
      this.logger.error(error);
    }
  }
}