import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId, SchemaTypes } from 'mongoose';

export enum created_by {
  user = 'user',
  admin = 'admin',
}

export enum status {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  cancelled = 'cancelled',
}

export enum TransactionType {
  'ngo' = 'ngo-donation',
  'fund' = 'fund-donation',
  'fundraiser' = 'donation',
}
export type ManualTransferDocument = ManualTransfer & Document;

@Schema({ timestamps: true, collection: 'manual_transfer' })
export class ManualTransfer {
  @Prop({ type: String, required: true })
  currency: string;

  @Prop({ type: String, required: true })
  currency_symbol: string;

  @Prop({
    type: String,
    required: function () {
      return this.created_by === 'user';
    },
  })
  country_name: string;

  @Prop({ type: Date })
  transaction_date: Date;

  @Prop({ type: String })
  transaction_id: string;

  @Prop({ type: String, required: true })
  transaction_type: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({
    type: String,
    required: function () {
      return this.created_by === 'user';
    },
  })
  receipt_image: string;

  @Prop({ type: String, default: 'user' })
  created_by: string;

  @Prop({ type: SchemaTypes.ObjectId })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  donor_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  created_user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  request_id: ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    required: function () {
      return this.status === status.approved;
    },
  })
  receipt_id: ObjectId;

  @Prop({ type: String, default: 'pending' })
  status: string;

  @Prop({
    type: String,
    required: function () {
      return this.status === status.rejected;
    },
  })
  reject_reason: string;

  @Prop({ type: Date })
  action_date: Date;

  @Prop({ type: String })
  user_phone_country_full_name: string;

  @Prop({ type: String })
  user_phone_country_short_name: string;

  @Prop({ type: String })
  user_phone: string;

  @Prop({ type: String })
  user_phone_code: string;

  @Prop({ type: String })
  user_name: string;

  @Prop({ type: String })
  user_email: string;
}
export const ManualTransferSchema =
  SchemaFactory.createForClass(ManualTransfer);
