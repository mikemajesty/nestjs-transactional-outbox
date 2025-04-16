import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { TypeORMRepository } from '@/infra/repository/postgres/repository';
import { IInventoryRepository } from '@/inventory/core/repository/inventory';
import { InventorySchema } from '@/inventory/infra/database/postgres/schemas/inventory';
import { InventoryEntity } from '@/inventory/core/entity/inventory';


@Injectable()
export class InventoryRepository
  extends TypeORMRepository<Model>
  implements IInventoryRepository {
  constructor(readonly repository: Repository<Model>) {
    super(repository);
  }
}

type Model = InventorySchema & InventoryEntity;