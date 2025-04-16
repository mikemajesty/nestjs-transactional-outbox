import { MongoRepositoryModelSessionType } from '@/utils/mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel } from 'mongoose';

import { MongoRepository } from '@/infra/repository';
import { Order, OrderDocument } from '@/order/infra/database/mongo/schemas/order';
import { IOrderRepository } from '@/order/core/repository/order';

@Injectable()
export class OrderRepository extends MongoRepository<OrderDocument> implements IOrderRepository {
  constructor(@InjectModel(Order.name) readonly entity: MongoRepositoryModelSessionType<PaginateModel<OrderDocument>>) {
    super(entity);
  }
}
