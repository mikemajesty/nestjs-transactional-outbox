import { RedisService } from '@/infra/redis/service';
import { OrderEntity } from '@/order/core/entity/order';
import { OutboxEntity, OutboxStatus } from '@/order/core/entity/outbox';
import { IOrderRepository } from '@/order/core/repository/order';
import { IOutboxRepository } from '@/order/core/repository/outbox';
import { IProducerAdapter } from '@/order/infra/producer/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req, Version } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import mongoose from 'mongoose';


@Controller('outbox')
@ApiTags("Outbox")
export class OutboxController {
  constructor(
    private readonly outboxRepository: IOutboxRepository,
  ) {}

  @Put(":id")
  async update(@Body() body: OutboxEntity, @Param() params: { id: string }) {
    console.log('params', params);
    console.log('body', body);
    const outbox = await this.outboxRepository.findOne({ id: params.id })
    if (!outbox) {
      throw new ApiNotFoundException(`outbox with id: ${params.id}`)
    }
    const entity = new OutboxEntity({ ...outbox, ...body })
    console.log('toUpdate', entity);
    await this.outboxRepository.updateOne({ id: entity.id }, entity)
    console.log('success');
  }
}
