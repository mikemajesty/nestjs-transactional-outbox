import { Module } from '@nestjs/common';
import { HealthModule } from './health/module';
import { InfraModule } from '../infra/module';
import { ProducerModule } from '../infra/producer/module';
import { OrderModule } from './order/module';
import { RedisCacheModule } from '@/infra/redis/module';
import { AlertController } from './alert';
import { OutboxModule } from './outobx/module';

@Module({
  imports: [HealthModule, InfraModule, OrderModule, ProducerModule, RedisCacheModule, OutboxModule],
  controllers: [AlertController],
  providers: [],
})
export class AppModule {}
