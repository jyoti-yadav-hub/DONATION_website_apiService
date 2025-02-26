/* eslint-disable prettier/prettier */
import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NgoModelDocument = NgoModel & Document;

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
export class NgoModel {
  @Prop({ type: Object })
  form_data: object;

  @Prop({ type: String })
  form_settings: string;

  @Prop({ type: Array, default: [] })
  ngo_causes: [];

  @Prop({ type: Object })
  ngo_address: object;

  @Prop({ type: Boolean })
  is_enable: boolean;

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

  @Prop({ type: Object, default: { hunger: 0 } })
  my_request: {};

  @Prop({ type: Array })
  report_ngo: [];

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
  vission: string;

  @Prop({ type: String })
  mission: string;

  @Prop({ type: String })
  programs: string;

  @Prop({ type: String })
  history: string;

  @Prop({ type: String })
  values_and_principles: string;

  @Prop({ type: String })
  form_country_code: string;
}
export const NgoModelSchema = SchemaFactory.createForClass(NgoModel);
NgoModelSchema.index({
  is_deleted: 'text',
  ngo_status: 'text',
});
