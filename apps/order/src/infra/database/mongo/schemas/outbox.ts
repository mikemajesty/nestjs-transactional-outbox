import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as SchamaType } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { OutboxEntity } from '@/order/core/entity/outbox';

export type OutboxDocument = Document & OutboxEntity;

@Schema()
class PayloadSchema {
  @Prop({ type: String })
  id!: string;

  @Prop({ type: String })
  name!: string;

  @Prop({ type: String })
  description!: string;
}

@Schema({
  collection: 'outbox',
  autoIndex: true,
  timestamps: true
})
export class Outbox {
  @Prop({ type: String })
  _id!: string;

  @Prop({ min: 0, max: 200, required: true, type: String })
  aggregateType!: string;

  @Prop({ min: 0, max: 200, required: true, type: String })
  aggregateId!: string;

  @Prop({ min: 0, max: 200, required: true, type: String })
  eventType!: string;

  @Prop({ type: PayloadSchema })
  payload!: PayloadSchema;

  @Prop({ min: 0, max: 200, required: true, type: String })
  status!: 'pending' | 'processed' | 'failed';

  @Prop({ min: 0, max: 200, required: false, type: Number })
  retryCount!: number

  @Prop({ type: Date, default: null })
  lastAttemptAt!: Date;

  @Prop({ type: Date, default: null })
  deletedAt!: Date;
}

const OutboxSchema = SchemaFactory.createForClass(Outbox);

OutboxSchema.plugin(paginate);

OutboxSchema.virtual('id').get(function () {
  return this._id;
});

export { OutboxSchema };
