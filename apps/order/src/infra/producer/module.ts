import { Module } from '@nestjs/common';

import { ILoggerAdapter, LoggerModule } from '@/infra/logger';

import { IKafkaAdapter } from '../kafka/adapter';
import { KafkaModule } from '../kafka/module';
import { IProducerAdapter } from './adapter';
import { ProducerService } from './service';

@Module({
  imports: [KafkaModule, LoggerModule],
  providers: [
    {
      provide: IProducerAdapter,
      useFactory(kafka: IKafkaAdapter, logger: ILoggerAdapter) {
        return new ProducerService(kafka, logger);
      },
      inject: [IKafkaAdapter, ILoggerAdapter],
    },
  ],
  exports: [IProducerAdapter],
})
export class ProducerModule {}
