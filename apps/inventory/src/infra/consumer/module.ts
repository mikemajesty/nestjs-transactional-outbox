import { Module } from '@nestjs/common';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';

import { IKafkaAdapter } from '../kafka/adapter';
import { KafkaModule } from '../kafka/module';
import { IConsumerAdapter } from './adapter';
import { ConsumerService } from './service';

@Module({
  imports: [KafkaModule],
  providers: [
    {
      provide: IConsumerAdapter,
      useFactory(kafka: IKafkaAdapter) {
        return new ConsumerService(kafka);
      },
      inject: [IKafkaAdapter],
    },
  ],
  exports: [IConsumerAdapter],
})
export class ConsumerModule {}
