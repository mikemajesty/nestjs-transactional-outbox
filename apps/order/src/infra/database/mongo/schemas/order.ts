import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { OrderEntity } from '@/order/core/entity/order';

export type OrderDocument = Document & OrderEntity;

@Schema({
  collection: 'orders',
  autoIndex: true,
  timestamps: true
})
export class Order {
  @Prop({ type: String })
  _id!: string;

  @Prop({ min: 0, max: 200, required: true, type: String })
  name!: string;

  @Prop({ min: 0, max: 200, required: true, type: String })
  description!: string;

  @Prop({ type: Date, default: null })
  deletedAt!: Date;
}

const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ name: 1 }, { partialFilterExpression: { deletedAt: { $eq: null } } });

OrderSchema.plugin(paginate);

OrderSchema.virtual('id').get(function () {
  return this._id;
});

export { OrderSchema };
