import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection, PaginateModel, Schema } from 'mongoose';

import { ConnectionName } from '@/order/infra/database/mongo/enum';
import { MongoRepositoryModelSessionType } from '@/utils/mongoose';
import { ProducerModule } from '@/order/infra/producer/module';
import { KafkaModule } from '@/order/infra/kafka/module';
import { RedisCacheModule } from '@/infra/redis/module';
import { MongoDatabaseModule } from '@/order/infra/database/mongo';
import { Outbox, OutboxDocument, OutboxSchema } from '@/order/infra/database/mongo/schemas/outbox';
import { IOutboxRepository } from '@/order/core/repository/outbox';
import { OutboxRepository } from './repository';
import { OutboxController } from './controller';

@Module({
  imports: [MongoDatabaseModule],
  controllers: [OutboxController],
  providers: [
    {
      provide: IOutboxRepository,
      useFactory: async (connection: Connection) => {
        type Model = mongoose.PaginateModel<OutboxDocument>;

        const repository: MongoRepositoryModelSessionType<PaginateModel<OutboxDocument>> = connection.model<
          OutboxDocument,
          Model
        >(Outbox.name, OutboxSchema as Schema);

        repository.connection = connection;

        return new OutboxRepository(repository);
      },
      inject: [getConnectionToken(ConnectionName.ORDER)]
    }
  ],
  exports: [IOutboxRepository]
})
export class OutboxModule {}