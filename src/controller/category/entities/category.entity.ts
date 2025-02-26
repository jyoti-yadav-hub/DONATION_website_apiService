/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  label_of_count: string;

  @Prop({ type: String })
  category_slug: string;

  @Prop({ type: Array, default: [] })
  who_can_access: [];

  @Prop({ type: String })
  icon: string;

  @Prop({ type: String })
  image: string;

  @Prop({ type: String, length: 255 })
  description: string;

  @Prop({ type: String })
  header_form: string;

  @Prop({ type: String })
  form_settings: string;

  @Prop({ type: String, default: 'deactive' })
  is_category_active: string;

  @Prop({ type: Boolean })
  is_urgent_help: boolean;

  @Prop({ type: Boolean })
  for_fund: boolean;

  @Prop({ type: Boolean, default: false })
  is_template: boolean;

  @Prop({ type: Boolean })
  for_fundraiser: boolean;

  @Prop({ type: Boolean })
  for_corporate: boolean;

  @Prop({ type: Number })
  request_count: number;

  @Prop({ type: Boolean, default: false })
  comment_enabled: boolean;

  @Prop({ type: Number })
  index: number;

  @Prop({ type: String, required: true })
  restore_form_data: string;

  @Prop({ type: Array, default: [] })
  countries: [];

  @Prop({ type: Boolean })
  is_draft: boolean;

  @Prop({ type: Boolean, default: false })
  is_stepper: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({
  category_slug: 'text',
  is_category_active: 'text',
  index: 'text',
});
