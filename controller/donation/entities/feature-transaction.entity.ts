/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type FeatureTransactionDocument = FeatureTransactionModel & Document;

@Schema({ timestamps: true, collection: 'feature-transactions' })
export class FeatureTransactionModel {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  reference_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: String })
  active_type: string;

  @Prop({ type: Object })
  country_data: {
    country: string;
    country_code: string;
    currency: string;
    currency_code: string;
  };

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: String })
  user_name: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  request_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  category_id: ObjectId;

  @Prop({ type: String })
  category_name: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String })
  currency: string;

  @Prop({ type: String, required: true })
  receipt_number: string;

  @Prop({ type: SchemaTypes.ObjectId })
  user_ngo_id: ObjectId;

  @Prop({ type: String })
  transaction_type: string;

  @Prop({ type: String })
  pspReference: string;

  @Prop({ type: Boolean })
  success: boolean;

  @Prop({ type: String })
  eventCode: string;

  @Prop({ type: Object })
  resp: object;

  @Prop({ type: Object })
  plan: object;

  @Prop({ type: String })
  paymentMethod: string;

  @Prop({ type: String })
  campaign_name: string;

  @Prop({ type: Object })
  redirectResult: object;

  @Prop({ type: Object })
  payload: object;

  @Prop({ type: String })
  resultCode: string;

  @Prop({ type: String })
  payment_status: string;

  @Prop({ type: String })
  payment_gateway: string;

  @Prop({ type: String })
  status: string;
}

export const FeatureTransactionSchema = SchemaFactory.createForClass(
  FeatureTransactionModel,
);
FeatureTransactionSchema.index({
  reference_id: 'text',
  user_id: 'text',
  transaction_type: 'text',
  request_id: 'text',
});
