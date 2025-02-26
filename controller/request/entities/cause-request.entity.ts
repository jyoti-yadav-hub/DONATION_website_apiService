/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  ObjectId,
  Schema as MongooseSchema,
  SchemaTypes,
} from 'mongoose';

export type CauseRequestDocument = CauseRequestModel & Document;

@Schema({ collection: 'requests' })
export class CauseRequestModel {
  @Prop({ type: String })
  reference_id: string;

  @Prop({ type: String, required: true })
  category_slug: string;

  @Prop({ type: String, required: true })
  category_name: string;

  @Prop({ type: String, required: true })
  active_type: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  user_ngo_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  corporate_id: ObjectId;

  @Prop({ type: Array })
  fundraiser_status: [];

  @Prop({ type: String })
  uname: string;

  @Prop({ type: String })
  user_image: string;

  @Prop({ type: Object, required: true })
  form_data: object;

  @Prop({ type: String })
  form_settings: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: String })
  reject_reason: string;

  @Prop({ type: Date })
  reject_time: Date;

  @Prop({ type: Date })
  transaction_time: Date;

  @Prop({ type: Number })
  last_transaction: number;

  @Prop({ type: Number })
  total_transfer: number;

  @Prop({ type: Number })
  remaining_transfer: number;

  @Prop({ type: Date })
  approve_time: Date;

  @Prop({ type: Array })
  plan: [];

  @Prop({ type: Date })
  plan_expired_date: Date;

  @Prop({ type: Boolean })
  is_featured: boolean;

  @Prop({ type: Array })
  report_benificiary: [];

  @Prop({ type: Number, default: 0 })
  total_donation: number;

  @Prop({ type: Number, default: 0 })
  total_donors: number;

  @Prop({ type: Number, default: 0 })
  avg_donation: number;

  @Prop({ type: Number })
  funded_in_days: number;

  @Prop({ type: Object })
  ngo_detail: object;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: Array, default: [] })
  volunteer_id: any;

  @Prop({ type: Boolean })
  noVolunteer: boolean;

  @Prop({ type: Object })
  country_data: {
    country: string;
    country_code: string;
    currency: string;
    currency_code: string;
  };

  @Prop({ type: Boolean })
  comment_enabled: boolean;

  @Prop({ type: String })
  bank_id: string;

  @Prop({ type: Array })
  add_location_for_food_donation: [];

  @Prop({ type: Array })
  disaster_links: [];

  @Prop({ type: Date, default: new Date() })
  createdAt: Date;

  @Prop({ type: Date, default: new Date() })
  updatedAt: Date;

  @Prop({ type: Object })
  location: {
    type: {};
    coordinates: [number];
    city: string;
  };

  @Prop({ type: Object }) //cancel request made for cancel ongoing requests
  cancel_request_for_delete_request_reason: object;

  @Prop({ type: Object }) //apply request for cancel ongoing requests
  send_request_for_delete_request_reason: object;

  @Prop({ type: Boolean })
  delete_request: boolean;

  @Prop({ type: Boolean })
  allow_edit_request: boolean;

  @Prop({ type: Boolean })
  allow_for_reverify: boolean;

  @Prop({ type: Boolean })
  block_request: boolean;

  @Prop({ type: String })
  block_reason: string;

  @Prop({ type: Date })
  volunteer_accept_time: Date;

  @Prop({ type: Array })
  admins: [];
}

export const CauseRequestSchema =
  SchemaFactory.createForClass(CauseRequestModel);
CauseRequestSchema.index({ location: '2dsphere' });
CauseRequestSchema.index({
  category_slug: 'text',
  active_type: 'text',
  user_id: 'text',
  user_ngo_id: 'text',
  corporate_id: 'text',
  status: 'text',
  is_deleted: 'text',
});
