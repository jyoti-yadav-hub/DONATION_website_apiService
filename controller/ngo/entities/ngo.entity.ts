/* eslint-disable prettier/prettier */
import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NgoDocument = Ngo & Document;

export enum Platform {
  Android = 'Android',
  Ios = 'Ios',
  web = 'web',
}
export enum OtpPlatform {
  app = 'app',
  web = 'web',
}
@Schema({ timestamps: true, collection: 'ngo' })
export class Ngo {
  @Prop({ type: String, default: null })
  ngo_phone_code: string;

  @Prop({ type: String, default: null })
  ngo_phone: string;

  @Prop({ type: String, required: true })
  phone_country_full_name: string;

  @Prop({ type: String, required: true })
  phone_country_short_name: string;

  @Prop({ type: String })
  secondary_country_full_name: string;

  @Prop({ type: String })
  secondary_country_short_name: string;

  @Prop({ type: String })
  secondary_phone_code: string;

  @Prop({ type: String })
  secondary_phone: string;

  @Prop({ type: String })
  website_link: string;

  @Prop({ type: Object, required: true })
  ngo_location: {
    type: string;
    coordinates: [number];
    city: string;
  };

  @Prop({ type: Array, default: [] })
  ngo_causes: [];

  @Prop({ type: String })
  ngo_cover_image: string;

  @Prop({ type: String })
  ngo_deed: string;

  @Prop({ type: String })
  ngo_certificate: string;

  @Prop({ type: Boolean })
  is_enable: boolean;

  @Prop({ type: String })
  ngo_name: string;

  @Prop({ type: String })
  ngo_email: string;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Date })
  expiry_date: Date;

  @Prop({ type: Date })
  renew_reminder_date: Date;

  @Prop({ type: String })
  delete_account_reason: string;

  @Prop({ type: String })
  first_name: string;

  @Prop({ type: String })
  last_name: string;

  @Prop({ type: String })
  ngo_registration_number: string;

  @Prop({ type: Array })
  trustees_name: [];

  @Prop({ type: Array })
  removed_trustee: [];

  @Prop({ type: String })
  reject_reason: string;

  @Prop({ type: String })
  ngo_status: string;

  @Prop({ type: Date })
  approve_time: Date;

  @Prop({ type: Date })
  reject_time: Date;

  @Prop({ type: Date })
  reverify_time: Date;

  @Prop({ type: String })
  transfer_reason: string;

  @Prop({ type: Array })
  transfer_documents: [];

  @Prop({ type: Boolean })
  transfer_account: boolean;

  @Prop({ type: String })
  form_settings: string;

  @Prop({ type: Object, default: { hunger: 0 } })
  my_request: {};

  @Prop({ type: Array })
  report_ngo: [];

  @Prop({ type: Boolean, default: false })
  @Prop({ type: Boolean, default: false })
  upload_12A_80G_certificate: boolean;

  @Prop({ type: Boolean, default: false })
  @Prop({ type: Boolean, default: false })
  upload_FCRA_certificate: boolean;

  @Prop({ type: String })
  ngo_12A_certificate: string;

  @Prop({ type: String })
  ngo_80G_certificate: string;

  @Prop({ type: String })
  ngo_FCRA_certificate: string;

  @Prop({ type: String })
  block_reason: string;

  @Prop({ type: String })
  block_type: string;

  @Prop({ type: Boolean })
  is_expired: boolean;

  @Prop({ type: Boolean })
  is_close: boolean;

  @Prop({ type: Object })
  country_data: {
    country: string;
    currency: [];
    emoji: string;
    country_code: string;
  };

  @Prop({ type: String })
  time_zone: string;

  @Prop({ type: String })
  about_us: string;

  @Prop({ type: String })
  vission: string;

  @Prop({ type: String })
  mission: string;

  @Prop({ type: String })
  programs: string;

  @Prop({ type: String })
  history: string;

  @Prop({ type: String })
  values_and_principles: string;

  @Prop({ type: Object })
  form_data: object;

  @Prop({ type: Object })
  ngo_address: object;

  @Prop({ type: Boolean, default: false })
  created_by_admin: boolean;

  @Prop({ type: String })
  form_country_code: string;
}
export const NgoSchema = SchemaFactory.createForClass(Ngo);
NgoSchema.index({
  ngo_phone: 'text',
  ngo_phone_code: 'text',
  secondary_phone_code: 'text',
  secondary_phone: 'text',
  ngo_email: 'text',
  is_deleted: 'text',
  ngo_status: 'text',
  ngo_address: '2dsphere'
});
