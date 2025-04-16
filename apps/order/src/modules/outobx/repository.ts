import { MongoRepositoryModelSessionType } from '@/utils/mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { MongoRepository } from '@/infra/repository';
import { Outbox, OutboxDocument } from '@/order/infra/database/mongo/schemas/outbox';
import { IOutboxRepository } from '@/order/core/repository/outbox';
import { ClientSession } from 'mongoose';

@Injectable()
export class OutboxRepository extends MongoRepository<OutboxDocument> implements IOutboxRepository {
  constructor(@InjectModel(Outbox.name) readonly entity: MongoRepositoryModelSessionType<PaginateModel<OutboxDocument>>) {
    super(entity);
  }

  getTransaction(): Promise<ClientSession> {
    return this.entity.startSession()
  }
}
