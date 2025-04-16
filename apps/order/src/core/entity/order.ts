import { BaseEntity } from '@/utils/entity';
import { UUIDUtils } from '@/utils/uuid';
import { Infer, InputValidator } from '@/utils/validator';

const ID = InputValidator.string().optional();
const Name = InputValidator.string().trim().min(1).max(200);
const Description = InputValidator.string().trim().min(1).max(200);
const CreatedAt = InputValidator.date().nullish();
const UpdatedAt = InputValidator.date().nullish();
const DeletedAt = InputValidator.date().nullish();

export const OrderEntitySchema = InputValidator.object({
  id: ID,
  name: Name,
  description: Description,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Order = Infer<typeof OrderEntitySchema>;

export class OrderEntity extends BaseEntity<OrderEntity>() {
  name!: string;

  description!: string;

  constructor(entity: Order) {
    if (!entity.id) {
      entity.id = UUIDUtils.create()
    }

    if ((entity as unknown as { _id: string })?._id) {
      entity.id = (entity as unknown as { _id: string })._id
    }
    super(OrderEntitySchema);
    Object.assign(this, OrderEntitySchema.parse(entity));
  }
}
