import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CorporateDocument = Corporate & Document;

export enum Platform {
  Android = 'Android',
  Ios = 'Ios',
  web = 'web',
}

@Schema({ timestamps: true })
export class Corporate {
  @Prop({ type: String, required: true })
  first_name: string;

  @Prop({ type: String, required: true })
  last_name: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  phone_code: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  phone_country_full_name: string;

  @Prop({ type: String, required: true })
  phone_country_short_name: string;

  @Prop({ type: String, required: true })
  organization_name: string;

  @Prop({ type: String, required: true })
  job_title: string;

  @Prop({ type: String, required: true })
  website: string;

  @Prop({ type: Object, required: true })
  location: {
    type: string;
    coordinates: [number];
    city: string;
  };

  @Prop({ type: Boolean, default: false })
  is_authorise: boolean;

  @Prop({ type: Object })
  form_data: object;

  @Prop({ type: String })
  form_settings: string;

  @Prop({ type: Array, default: [] })
  causes: [];

  @Prop({ type: Boolean, default: false })
  agree_to_partner: boolean;

  @Prop({ type: Object })
  country_data: {
    country: string;
    currency: [];
    emoji: string;
    country_code: string;
  };

  @Prop({ type: String })
  time_zone: string;

  @Prop({ type: Boolean })
  profile_set: boolean;
}
export const CorporateSchema = SchemaFactory.createForClass(Corporate);
CorporateSchema.index({
  phone: 'text',
  phone_code: 'text',
  email: 'text',
});
