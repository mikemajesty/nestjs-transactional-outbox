import { Module } from '@nestjs/common';
import { InfraModule } from '../infra/module';
import { KafkaModule } from '../infra/kafka/module';
import { ConsumerApp } from './consumer/module';
import { RedisCacheModule } from '@/infra/redis/module';
import { InventoryModule } from './inventory/module';

@Module({
  imports: [InfraModule, ConsumerApp, RedisCacheModule, InventoryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
