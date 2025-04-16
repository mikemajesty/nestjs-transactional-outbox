import { Module } from '@nestjs/common';

import { IKafkaAdapter } from './adapter';
import { KafkaService } from './service';
import { name } from '../../../package.json';
import { Kafka } from 'kafkajs';

@Module({
  imports: [],
  providers: [
    {
      provide: IKafkaAdapter,
      useFactory() {
        const kafka = new Kafka({
          clientId: name,
          brokers: ['localhost:29092'],
          connectionTimeout: 3000
        })

        return new KafkaService(kafka);
      },
    },
  ],
  exports: [IKafkaAdapter],
})
export class KafkaModule {}
