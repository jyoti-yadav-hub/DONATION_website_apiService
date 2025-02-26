/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type RequestDocument = RequestModel & Document;

@Schema({ collection: 'requests' })
export class RequestModel {
  @Prop({ type: String })
  reference_id: string;

  @Prop({ type: String })
  category_slug: string;

  @Prop({ type: String })
  category_name: string;

  @Prop({ type: String })
  active_type: string;

  @Prop({ type: SchemaTypes.ObjectId })
  user_id: ObjectId;

  @Prop({ type: String })
  uname: string;

  @Prop({ type: String })
  user_image: string;

  @Prop({ type: String })
  form_settings: string;

  @Prop({ type: Object })
  location: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    type: {};
    coordinates: [number];
    city: string;
  };
  @Prop({ type: Object })
  form_data: object;

  @Prop({ type: SchemaTypes.ObjectId })
  user_ngo_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  corporate_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  donor_ngo_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  volunteer_ngo_id: ObjectId;

  @Prop({ type: String })
  status: string;

  @Prop({ type: Number })
  prepare_time: number;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: Object })
  donor_accept: {
    user_name: string;
    phone: string;
    image: string;
    address: string;
    lat: number;
    lng: number;
    accept_time: Date;
    restaurant_name: string;
    country_code: string;
  };

  @Prop({ type: Object })
  volunteer_accept: {
    user_name: string;
    phone: string;
    image: string;
    address: string;
    lat: number;
    lng: number;
    accept_time: Date;
    country_code: string;
  };

  @Prop({ type: Boolean })
  deliver_by_self: boolean;

  @Prop({ type: Date })
  picked_up_time: Date;

  @Prop({ type: Date })
  deliver_time: Date;

  @Prop({ type: Date })
  cancelled_at: Date;

  @Prop({ type: Date })
  delete_time: Date;

  @Prop({ type: String })
  cancelled_by: string;

  @Prop({ type: String })
  cancellation_reason: string;

  @Prop({ type: Array })
  volunteer_id: any;

  @Prop({ type: Array })
  ngo_volunteer_ids: any;

  @Prop({ type: Array })
  donor_id: any;

  @Prop({ type: Array })
  ngo_donor_ids: any;

  @Prop({ type: Array })
  ngo_ids: any;

  @Prop({ type: Array })
  accept_donor_ids: [];

  @Prop({ type: Array })
  accept_volunteer_ids: [];

  @Prop({ type: Object })
  userDtl: object;

  @Prop({ type: String })
  image_url: string;

  @Prop({ type: String })
  current_type: string;

  @Prop({ type: Boolean })
  noVolunteer: boolean;

  @Prop({ type: Object })
  country_data: {
    country: string;
    country_code: string;
    currency: string;
    currency_code: string;
  };

  @Prop({ type: String })
  reject_reason: string;

  @Prop({ type: Date })
  reject_time: Date;

  @Prop({ type: Date })
  transaction_time: Date;

  @Prop({ type: Number })
  transfer_amount: number;

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

  @Prop({ type: Number })
  total_donation: number;

  @Prop({ type: Number })
  total_donors: number;

  @Prop({ type: Number })
  avg_donation: number;

  @Prop({ type: Number })
  funded_in_days: number;

  @Prop({ type: Object })
  ngo_detail: object;

  @Prop({ type: String })
  distance: string;

  @Prop({ type: String })
  duration: string;

  @Prop({ type: String })
  race: string;

  @Prop({ type: String })
  religion: string;

  @Prop({ type: Boolean })
  comment_enabled: boolean;

  @Prop({ type: String })
  bank_id: string;

  @Prop({ type: Array })
  add_location_for_food_donation: [];

  @Prop({ type: Array })
  disaster_links: [];

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ type: String })
  block_reason: string;

  @Prop({ type: Boolean })
  allow_edit_request: boolean;

  @Prop({ type: Boolean })
  is_blocked: boolean;

  @Prop({ type: SchemaTypes.ObjectId })
  testimonial_id: ObjectId;

  @Prop({ type: Boolean })
  allow_testimonial: boolean;

  @Prop({ type: String })
  reject_testimonial_reason: string;

  @Prop({ type: String })
  testimonial_status: string;

  @Prop({ type: Date })
  volunteer_accept_time: Date;

  @Prop({ type: Boolean })
  allow_for_reverify: boolean;

  @Prop({ type: Boolean })
  block_request: boolean;

  @Prop({ type: Array })
  admins: [];
}

export const RequestSchema = SchemaFactory.createForClass(RequestModel);
RequestSchema.index({ location: '2dsphere', volunteer_loc: '2dsphere' });
RequestSchema.index({
  category_slug: 'text',
  active_type: 'text',
  user_id: 'text',
  user_ngo_id: 'text',
  corporate_id: 'text',
  status: 'text',
  is_deleted: 'text',
});
