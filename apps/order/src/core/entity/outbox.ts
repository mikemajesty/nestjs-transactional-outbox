import { DateUtils } from '@/utils/date';
import { BaseEntity } from '@/utils/entity';
import { UUIDUtils } from '@/utils/uuid';
import { Infer, InputValidator } from '@/utils/validator';


export enum OutboxStatus {
  'pending' = 'pending',
  'processed' = 'processed',
  'failed' = 'failed'
}

const ID = InputValidator.string().optional();
const AggregateType = InputValidator.string().trim().min(1).max(200);
const AggregateId = InputValidator.string().trim().min(1).max(200);
const EventType = InputValidator.string().trim().min(1).max(200);
const Payload = InputValidator.any();
const Status = InputValidator.nativeEnum(OutboxStatus);
const RetryCount = InputValidator.number().min(0).max(6).default(0)
const LastAttemptAt = InputValidator.date().or(InputValidator.number()).nullish();
const CreatedAt = InputValidator.date().or(InputValidator.number()).nullish();
const UpdatedAt = InputValidator.date().or(InputValidator.number()).nullish();
const DeletedAt = InputValidator.date().or(InputValidator.number()).nullish();

export const OutboxEntitySchema = InputValidator.object({
  id: ID,
  aggregateType: AggregateType,
  aggregateId: AggregateId,
  eventType: EventType,
  payload: Payload,
  status: Status,
  retryCount: RetryCount,
  lastAttemptAt: LastAttemptAt,
  createdAt: CreatedAt,
  updatedAt: UpdatedAt,
  deletedAt: DeletedAt
});

type Outbox = Infer<typeof OutboxEntitySchema>;

export class OutboxEntity extends BaseEntity<OutboxEntity>() {
  aggregateType!: string // 'Order'

  aggregateId!: string; // ID do pedido

  eventType!: string; // 'OrderCreated'

  payload!: any; // Dados completos do pedido

  status!: OutboxStatus;

  retryCount!: number;

  lastAttemptAt?: Date = DateUtils.getDate().toJSDate();

  increment() {
    if (!this.retryCount) {
      this.retryCount = 1
      return
    }
    this.retryCount++
  }

  constructor(entity: Outbox) {
    if (!entity.id) {
      entity.id = UUIDUtils.create()
    }

    if ((entity as unknown as { _id: string })?._id) {
      entity.id = (entity as unknown as { _id: string })._id
    }
    super(OutboxEntitySchema);
    Object.assign(this, OutboxEntitySchema.parse(entity));
  }
}
