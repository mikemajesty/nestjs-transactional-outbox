import { IRepository } from '@/infra/repository';

import { OutboxEntity } from '../entity/outbox';
import { ClientSession } from 'mongoose';

export abstract class IOutboxRepository extends IRepository<OutboxEntity> {
  abstract getTransaction(): Promise<ClientSession>
}
