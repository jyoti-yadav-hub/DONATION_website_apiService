import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommonSettingDocument = CommonSetting & Document;

@Schema({ timestamps: true, collection: 'common-settings' })
export class CommonSetting {
  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String, required: true })
  currency: string;

  @Prop({ type: String })
  unit: string;

  @Prop({ type: String })
  payment_gateway: string;

  @Prop({ type: Number })
  service_fee: number;

  @Prop({ type: Number })
  transaction_fee: number;

  @Prop({ type: Object, required: true })
  form_data: {};

  @Prop({ type: String, required: true })
  form_settings: string;

  @Prop({ type: Boolean })
  is_draft: boolean;

  @Prop({ type: String })
  restore_form_data: string;

  @Prop({ type: String, default: 'active' })
  status: string;
}
export const CommonSettingSchema = SchemaFactory.createForClass(CommonSetting);
