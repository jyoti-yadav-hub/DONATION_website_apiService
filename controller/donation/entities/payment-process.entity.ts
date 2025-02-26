/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type PaymentProcessDocument = PaymentProcessModel & Document;

@Schema({ timestamps: true, collection: 'payment-process' })
export class PaymentProcessModel {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  request_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  fund_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  ngo_id: ObjectId;

  @Prop({ type: Number })
  amount: number;

  @Prop({ type: Object })
  country_data: {
    country: string;
    country_code: string;
    currency: string;
    currency_code: string;
  };

  @Prop({ type: Boolean })
  is_contribute_anonymously: boolean;

  @Prop({ type: Boolean })
  is_tax_benefit: boolean;

  @Prop({ type: String })
  tax_number: string;

  @Prop({ type: String })
  active_type: string;

  @Prop({ type: Object })
  response: object;

  @Prop({ type: Object })
  plan: object;

  @Prop({ type: String, required: true })
  transaction_type: string;

  @Prop({ type: Boolean })
  tip_included: boolean;

  @Prop({ type: Number })
  tip_amount: number;

  @Prop({ type: Number })
  tip_charge: number;

  @Prop({ type: Number })
  transaction_amount: number;

  @Prop({ type: Number })
  transaction_charge: number;

  @Prop({ type: Number })
  total_amount: number;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: String })
  payment_gateway: string;

  @Prop({ type: String })
  title_of_fundraiser: string;

  @Prop({ type: String })
  stripe_customer_id: string;

  @Prop({ type: String })
  note: string;

  @Prop({ type: String, enum: ['include', 'exclude'] })
  manage_fees: string;

  @Prop({ type: String })
  currency_code: string;

  @Prop({ type: Number })
  amount_usd: number;

  @Prop({ type: Number })
  converted_amt: number;

  @Prop({ type: Number })
  exchange_rate: number;

  @Prop({ type: Number })
  converted_total_amt: number;

  @Prop({ type: String })
  guest_name: string;

  @Prop({ type: SchemaTypes.ObjectId })
  corporate_id: ObjectId;
}
export const PaymentProcessSchema =
  SchemaFactory.createForClass(PaymentProcessModel);
PaymentProcessSchema.index({
  user_id: 'text',
  request_id: 'text',
  transaction_type: 'text',
});
