import { IRepository } from '@/infra/repository/adapter';

import { InventoryEntity } from '../entity/inventory';

export abstract class IInventoryRepository extends IRepository<InventoryEntity> {}