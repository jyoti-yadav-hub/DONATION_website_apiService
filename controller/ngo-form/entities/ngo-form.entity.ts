/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NgoFormDocument = NgoForm & Document;

@Schema({ timestamps: true, collection: 'ngo_form' })
export class NgoForm {
  @Prop({ type: String, required: true, index: true })
  country: string;

  @Prop({ type: String, required: true, index: true })
  country_code: string;

  @Prop({ type: String, required: true })
  form_data: string;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: Boolean, default: false })
  is_template: boolean;

  @Prop({ type: String })
  template_name: string;

  @Prop({ type: String, required: true })
  updatedBy: string;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: String })
  restore_form_data: string;
}
export const NgoFormSchema = SchemaFactory.createForClass(NgoForm);
