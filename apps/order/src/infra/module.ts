import { Module } from '@nestjs/common';
import { MongoDatabaseModule } from './database/mongo';
import { KafkaModule } from './kafka/module';
import { ProducerModule } from './producer/module';
import { LoggerModule } from '@/infra/logger';
@Module({
  imports: [
    MongoDatabaseModule,
    KafkaModule,
    ProducerModule,
    LoggerModule
  ],
  exports: [
    MongoDatabaseModule,
    KafkaModule,
    ProducerModule,
    LoggerModule
  ]
})
export class InfraModule {}
