import { IRepository } from '@/infra/repository';

import { OrderEntity } from '../entity/order';

export abstract class IOrderRepository extends IRepository<OrderEntity> {
}
