import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, SchemaTypes } from 'mongoose';

export type SettingDocument = Setting & Document;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  slug: string;

  @Prop({ type: String, required: true })
  value: string;

  @Prop({ type: String })
  category_slug: string;

  @Prop({ type: String, required: true })
  group_name: string;

  @Prop({ type: String, default: 'active' })
  status: string;
}
export const SettingSchema = SchemaFactory.createForClass(Setting);
SettingSchema.index({ status: 'text', group_name: 'text', slug: 'text' });
