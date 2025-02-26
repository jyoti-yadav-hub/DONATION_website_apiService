/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type FundDocument = Fund & Document;

@Schema({ timestamps: true, collection: 'fund' })
export class Fund {
  @Prop({ type: String })
  reference_id: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: String, required: true })
  active_type: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, required: true })
  category_slug: string;

  @Prop({ type: Object, required: true })
  form_data: object;

  @Prop({ type: String })
  form_settings: string;

  @Prop({ type: String, required: true })
  country_code: string;

  @Prop({ type: Object })
  country_data: object;

  @Prop({ type: Array, default: [] })
  fund_causes: [];

  @Prop({ type: Array, default: [] })
  regions: [];

  @Prop({ type: Array, default: [] })
  countries: [];

  @Prop({ type: Array, default: [] })
  report_fund: [];

  @Prop({ type: Date })
  approve_time: Date;

  @Prop({ type: Date })
  reject_time: Date;

  @Prop({ type: String })
  reject_reason: string;

  @Prop({ type: Array, default: [] })
  admins: [];

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: Boolean })
  allow_edit_fund: boolean;

  @Prop({ type: Boolean, default: false })
  is_default: boolean;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: SchemaTypes.ObjectId })
  corporate_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  user_ngo_id: ObjectId;
}

export const FundSchema = SchemaFactory.createForClass(Fund);
FundSchema.index({
  user_id: 'text',
  active_type: 'text',
  status: 'text',
  is_deleted: 'text',
  corporate_id: 'text',
});
