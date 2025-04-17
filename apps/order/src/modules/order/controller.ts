import { RedisService } from '@/infra/redis/service';
import { OrderEntity } from '@/order/core/entity/order';
import { OutboxEntity, OutboxStatus } from '@/order/core/entity/outbox';
import { IOrderRepository } from '@/order/core/repository/order';
import { IOutboxRepository } from '@/order/core/repository/outbox';
import { IProducerAdapter } from '@/order/infra/producer/adapter';
import { Body, Controller, Delete, Get, HttpCode, Post, Put, Req, Version } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import mongoose from 'mongoose';


@Controller('orders')
@ApiTags("Order")
export class OrderController {
  constructor(
    private readonly repository: IOrderRepository,
    private readonly outboxRepository: IOutboxRepository,
    private readonly producer: IProducerAdapter,
    private readonly redis: RedisService,
  ) {}

  @Post()
  @ApiBody({
    schema: {
      example: { name: "Galadeira", description: "Brastemp" } as OrderEntity
    }
  })
  async create(@Body() body: OrderEntity) {
    try {
      const session = await this.outboxRepository.getTransaction();
      session.startTransaction();

      try {
        const entity = new OrderEntity(body)
        await this.repository.create(entity)
        const outbox = new OutboxEntity({
          id: entity.id,
          aggregateId: "508aeef7-f081-4e72-90d3-764bda7deb9b",
          aggregateType: OutboxEntity.name,
          eventType: 'OrderCreated',
          payload: entity,
          status: OutboxStatus.pending,
          retryCount: 0
        })
        await this.outboxRepository.create(outbox)
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

      // for (let index = 0; index < 100; index++) {
      //   const entity = new OrderEntity(body)
      //   entity.id = `${index + 1}`
      //   await this.producer.publish({ messages: [{ value: JSON.stringify(entity) }], topic: TopicsProducerEnum.VERIFIED_INVENTORY })
      //   await new Promise(resolve => setTimeout(resolve, 1000));
      // }
      return 'Order created';
    } catch (error) {
      console.error(`OrderController.create => ${(error as { message?: string })?.['message'] ?? error}`);
    }
  }
}
