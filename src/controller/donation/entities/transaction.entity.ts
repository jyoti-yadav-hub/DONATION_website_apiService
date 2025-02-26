/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type TransactionDocument = TransactionModel & Document;

@Schema({ timestamps: true, collection: 'transactions' })
export class TransactionModel {
  @Prop({ type: SchemaTypes.ObjectId })
  reference_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  donor_id: ObjectId;

  @Prop({ type: String })
  donor_name: string;

  @Prop({ type: SchemaTypes.ObjectId })
  donor_user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  fund_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  from_fund_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  to_fund_id: ObjectId;

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

  @Prop({ type: SchemaTypes.ObjectId })
  request_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  category_id: ObjectId;

  @Prop({ type: String })
  category_name: string;

  @Prop({ type: String })
  category_slug: string;

  @Prop({ type: Number })
  amount: number;

  @Prop({ type: Number })
  goal_amount: number;

  @Prop({ type: Boolean })
  is_contribute_anonymously: boolean;

  @Prop({ type: Boolean })
  is_tax_benefit: boolean;

  @Prop({ type: String })
  tax_number: string;

  @Prop({ type: String })
  note: string;

  @Prop({ type: String })
  receipt_number: string;

  @Prop({ type: Boolean })
  is_user_ngo: boolean;

  @Prop({ type: Boolean })
  is_donor_ngo: boolean;

  @Prop({ type: String })
  transaction_type: string;

  @Prop({ type: String })
  pspReference: string;

  @Prop({ type: String })
  paymentMethod: string;

  @Prop({ type: Boolean })
  success: boolean;

  @Prop({ type: String })
  eventCode: string;

  @Prop({ type: Object })
  resp: object;

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

  @Prop({ type: String })
  currency: string;

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

  @Prop({ type: String, enum: ['include', 'exclude'] })
  manage_fees: string;

  @Prop({ type: Boolean })
  saayam_community: boolean;

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
  order_code: string;

  @Prop({ type: String })
  paymentGateway: string;

  @Prop({ type: SchemaTypes.ObjectId })
  fund_help_request_id: ObjectId;

  @Prop({ type: Boolean })
  download: boolean;

  @Prop({ type: SchemaTypes.ObjectId })
  corporate_id: ObjectId;
}

export const TransactionSchema = SchemaFactory.createForClass(TransactionModel);
TransactionSchema.index({
  reference_id: 'text',
  donor_id: 'text',
  donor_user_id : 'text',
  user_id: 'text',
  fund_id: 'text',
  from_fund_id :'text',
  to_fund_id : 'text',
  request_id: 'text',
  transaction_type: 'text',
});
