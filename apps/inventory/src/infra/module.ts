import { Module } from '@nestjs/common';
import { PostgresDatabaseModule } from './database/postgres';
import { KafkaModule } from './kafka/module';
import { ProducerModule } from '@/inventory/infra/producer/module';
import { ConsumerModule } from './consumer/module';
@Module({
  imports: [
    PostgresDatabaseModule,
    KafkaModule,
    ProducerModule,
    ConsumerModule
  ],
  exports: [PostgresDatabaseModule, KafkaModule, ProducerModule, ConsumerModule],
})
export class InfraModule {}
