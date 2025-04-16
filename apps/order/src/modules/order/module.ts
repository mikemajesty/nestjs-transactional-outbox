import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection, PaginateModel, Schema } from 'mongoose';

import { OrderController } from './controller';
import { ConnectionName } from '@/order/infra/database/mongo/enum';
import { IOrderRepository } from '@/order/core/repository/order';
import { Order, OrderDocument, OrderSchema } from '@/order/infra/database/mongo/schemas/order';
import { MongoRepositoryModelSessionType } from '@/utils/mongoose';
import { OrderRepository } from './repository';
import { ProducerModule } from '@/order/infra/producer/module';
import { KafkaModule } from '@/order/infra/kafka/module';
import { RedisCacheModule } from '@/infra/redis/module';
import { OutboxModule } from '../outobx/module';

@Module({
  imports: [KafkaModule, ProducerModule, RedisCacheModule, OutboxModule],
  controllers: [OrderController],
  providers: [
    {
      provide: IOrderRepository,
      useFactory: async (connection: Connection) => {
        type Model = mongoose.PaginateModel<OrderDocument>;

        const repository: MongoRepositoryModelSessionType<PaginateModel<OrderDocument>> = connection.model<
          OrderDocument,
          Model
        >(Order.name, OrderSchema as Schema);

        repository.connection = connection;

        return new OrderRepository(repository);
      },
      inject: [getConnectionToken(ConnectionName.ORDER)]
    }
  ],
  exports: [IOrderRepository]
})
export class OrderModule {}