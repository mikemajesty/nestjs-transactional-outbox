import { Injectable, OnModuleDestroy } from '@nestjs/common';

import { ErrorType, ILoggerAdapter } from '@/infra/logger';

import { TopicsProducerEnum } from '@/utils/topics';
import { IKafkaAdapter } from '../kafka/adapter';
import { IProducerAdapter } from './adapter';
import { EmitInput } from '@/utils/kafka';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';

@Injectable()
export class ProducerService implements IProducerAdapter, OnModuleDestroy {
  producer!: Producer;

  constructor(
    kafka: IKafkaAdapter,
    private readonly logger: ILoggerAdapter,
  ) {
    this.producer = kafka.client.producer({ allowAutoTopicCreation: true });
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