import { z } from 'zod';

import { BaseEntity } from '@/utils/entity';
import { UUIDUtils } from '@/utils/uuid';

const CreatedAt = z.date().or(z.string()).nullish().optional();
const UpdatedAt = z.date().or(z.string()).nullish().optional();
const DeletedAt = z.date().or(z.string()).nullish().optional();

export const InventoryEntitySchema = z.object({
  id: z.string().nullish(),
  productId: z.string().uuid(),
  stock: z.number(),
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt,
});

type Product = z.infer<typeof InventoryEntitySchema>;

export class InventoryEntity extends BaseEntity<InventoryEntity>() {
  id!: string;

  productId!: string;

  stock!: number;

  constructor(entity: Product) {
    if (!entity.id) {
      entity.id = UUIDUtils.create()
    }

    if ((entity as unknown as { _id: string })?._id) {
      entity.id = (entity as unknown as { _id: string })._id
    }
    super(InventoryEntitySchema);
    Object.assign(this, this.validate(entity));
  }
}