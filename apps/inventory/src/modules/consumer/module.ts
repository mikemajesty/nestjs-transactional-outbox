import { Module } from '@nestjs/common';

import { KafkaModule } from '../../infra/kafka/module';
import { ConsumerController } from './controller';
import { OpenTelemetryModule } from 'nestjs-otel';
import { ProducerModule } from '@/inventory/infra/producer/module';
import { ConsumerModule } from '@/inventory/infra/consumer/module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MetricsService } from './metrics';
import { RedisCacheModule } from '@/infra/redis/module';
import { InventoryModule } from '../inventory/module';
import { HttpModule } from '@nestjs/axios';

const OpenTelemetryModuleConfig = OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true, // Includes Host Metrics
    apiMetrics: {
      enable: true, // Includes api metrics
      ignoreRoutes: ['/favicon.ico'], // You can ignore specific routes (See https://docs.nestjs.com/middleware#excluding-routes for options)
      ignoreUndefinedRoutes: false, //Records metrics for all URLs, even undefined ones
    },
  },
});

@Module({
  imports: [KafkaModule, ProducerModule, ConsumerModule, EventEmitterModule.forRoot(), OpenTelemetryModuleConfig, RedisCacheModule, InventoryModule, HttpModule],
  controllers: [ConsumerController],
  providers: [MetricsService],
})
export class ConsumerApp {}
