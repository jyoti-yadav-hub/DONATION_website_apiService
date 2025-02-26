/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type UserDocument = User & Document;

export enum Platform {
  Android = 'Android',
  Ios = 'Ios',
  web = 'web',
}
export enum Gender {
  Male = 'Male',
  Female = 'Female',
}
export enum OtpPlatform {
  app = 'app',
  web = 'web',
}

@Schema({ timestamps: true, collection: 'user' })
export class User {
  @Prop({ type: String })
  first_name: string;

  @Prop({ type: String })
  last_name: string;

  @Prop({ type: String, default: null })
  display_name: string;

  @Prop({ type: String })
  phone_code: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  phone_country_full_name: string;

  @Prop({ type: String })
  phone_country_short_name: string;

  @Prop({ type: String, default: null })
  email: string;

  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: Boolean, default: false })
  is_user: boolean;

  @Prop({ type: Boolean, default: false })
  is_donor: boolean;

  @Prop({ type: Boolean, default: false })
  is_volunteer: boolean;

  @Prop({ type: Boolean })
  is_corporate: boolean;

  @Prop({ type: SchemaTypes.ObjectId })
  corporate_id: ObjectId;

  @Prop({ type: Object })
  location: {
    type: {};
    coordinates: [number];
    city: string;
  };

  @Prop({ type: Array })
  current_location: [number];

  @Prop({ type: Boolean })
  is_restaurant: boolean;

  @Prop({ type: String })
  restaurant_name: string;

  @Prop({ type: Object })
  restaurant_location: {
    type: {};
    coordinates: [number];
    city: string;
  };

  @Prop({ type: Boolean })
  is_veg: boolean;

  @Prop({ type: String })
  facebook_id: string;

  @Prop({ type: String })
  google_id: string;

  @Prop({ type: String })
  apple_id: string;

  @Prop({ type: Object, default: { hunger: 0 } })
  my_request: {};

  @Prop({ type: Array, default: [] })
  my_causes: [];

  @Prop({ type: Array, default: [] })
  access_token: [];

  @Prop({ type: Array, default: [] })
  uuid: [];

  @Prop({ type: String })
  platform: string;

  @Prop({ type: Boolean })
  is_ngo: boolean;

  @Prop({ type: SchemaTypes.ObjectId })
  ngo_id: ObjectId;

  @Prop({ type: String })
  socket_id: string;

  @Prop({ type: String })
  time_zone: string;

  @Prop({ type: String })
  race: string;

  @Prop({ type: String })
  religion: string;

  @Prop({ type: Object })
  ngo_data: {
    _id: ObjectId;
    ngo_causes: [];
    ngo_status: string;
    ngo_name: string;
    ngo_location: object;
  };

  @Prop({ type: Object })
  country_data: {
    country: string;
    currency: [];
    emoji: string;
    country_code: string;
  };

  @Prop({ type: String })
  default_country: string;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Boolean, default: false })
  blocked: boolean;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: String })
  delete_account_reason: string;

  @Prop({ type: String })
  blocked_account_reason: string;

  @Prop({ type: String })
  stripe_customer_id: string;

  @Prop({ type: String })
  stripe_account_id: string;

  @Prop({ type: String })
  blood_group: string;

  @Prop({ type: String })
  dob: string;

  @Prop({ type: String })
  gender: string;

  @Prop({ type: Boolean })
  is_guest: boolean;

  @Prop({ type: Boolean })
  is_corporate_user: boolean;

  @Prop({ type: Boolean })
  interview_user: boolean;

  @Prop({ type: String })
  password: string;
}
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ location: '2dsphere', restaurant_location: '2dsphere' });
UserSchema.index({
  display_name: 'text',
  phone: 'text',
  email: 'text',
  is_user: 'text',
  is_donor: 'text',
  is_volunteer:'text',
  is_corporate:'text',
  corporate_id:'text',
  access_token:1,
  uuid:1,
  is_ngo:'text',
  ngo_id:'text',
  is_deleted :'text'
});
