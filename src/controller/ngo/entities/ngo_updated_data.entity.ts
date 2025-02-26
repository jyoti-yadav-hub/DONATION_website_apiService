/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NgoUpdatedDocument = NgoUpdated & Document;

@Schema({ timestamps: false, collection: 'ngo-updated-data' })
export class NgoUpdated {
  @Prop({ type: SchemaTypes.ObjectId })
  ngo_id: ObjectId;

  @Prop({ type: String })
  ngo_phone_code: string;

  @Prop({ type: String })
  ngo_phone: string;

  @Prop({ type: String })
  phone_country_full_name: string;

  @Prop({ type: String })
  phone_country_short_name: string;

  @Prop({ type: String })
  secondary_country_full_name: string;

  @Prop({ type: String })
  secondary_country_short_name: string;

  @Prop({ type: String })
  secondary_phone_code: string;

  @Prop({ type: String })
  secondary_phone: string;

  @Prop({ type: Object })
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
  form_settings: string;

  @Prop({ type: String })
  ngo_deed: string;

  @Prop({ type: String })
  ngo_certificate: string;

  @Prop({ type: String })
  ngo_name: string;

  @Prop({ type: String })
  ngo_email: string;

  @Prop({ type: String })
  first_name: string;

  @Prop({ type: Date })
  expiry_date: Date;

  @Prop({ type: String })
  last_name: string;

  @Prop({ type: String })
  ngo_previous_status: string;

  @Prop({ type: String })
  ngo_registration_number: string;

  @Prop({ type: Array })
  trustees_name: [];

  @Prop({ type: Array })
  removed_trustee: [];

  @Prop({ type: Object })
  new_removed_trustee: object;

  @Prop({ type: String })
  transfer_reason: string;

  @Prop({ type: Array })
  transfer_documents: [];

  @Prop({ type: Boolean, default: false })
  upload_12A_80G_certificate: boolean;

  @Prop({ type: Boolean, default: false })
  upload_FCRA_certificate: boolean;

  @Prop({ type: String })
  ngo_12A_certificate: string;

  @Prop({ type: String })
  ngo_80G_certificate: string;

  @Prop({ type: String })
  ngo_FCRA_certificate: string;

  @Prop({ type: String })
  website_link: string;

  @Prop({ type: Boolean })
  transfer_account: boolean;

  @Prop({ type: String })
  block_reason: string;

  @Prop({ type: Date })
  block_date: Date;

  @Prop({ type: String })
  about_us: string;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: Object })
  form_data: object;

  @Prop({ type: Object })
  ngo_address: object;

  @Prop({ type: String })
  form_country_code: string;

  @Prop({ type: Object })
  country_data: {
    country: string;
    currency: [];
    emoji: string;
    country_code: string;
  };

  @Prop({ type: String })
  time_zone: string;
}
export const NgoUpdatedSchema = SchemaFactory.createForClass(NgoUpdated);
NgoUpdatedSchema.index({
  ngo_id: 'text',
  ngo_phone: 'text',
  ngo_phone_code: 'text',
  secondary_phone_code: 'text',
  secondary_phone: 'text',
  ngo_email: 'text',
  is_deleted: 'text',
});
