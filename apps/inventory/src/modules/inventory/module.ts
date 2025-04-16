import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InventoryRepository } from './repository';
import { InventorySchema } from '@/inventory/infra/database/postgres/schemas/inventory';
import { IInventoryRepository } from '@/inventory/core/repository/inventory';
import { InventoryEntity } from '@/inventory/core/entity/inventory';

@Module({
  imports: [TypeOrmModule.forFeature([InventorySchema])],
  providers: [
    {
      provide: IInventoryRepository,
      useFactory(repository: Repository<InventorySchema & InventoryEntity>) {
        return new InventoryRepository(repository);
      },
      inject: [getRepositoryToken(InventorySchema)],
    },
  ],
  exports: [IInventoryRepository],
})
export class InventoryModule {}