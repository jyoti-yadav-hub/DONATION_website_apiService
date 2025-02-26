/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ManageBankDocument = ManageBank & Document;

@Schema({ timestamps: true, collection: 'manage-bank' })
export class ManageBank {
  @Prop({ type: String, required: true, index: true })
  country: string;

  @Prop({ type: String, required: true, index: true })
  country_code: string;

  @Prop({ type: String, required: true })
  form_data: string;

  @Prop({ type: Boolean, default: false })
  is_template: boolean;

  @Prop({ type: String })
  template_name: string;

  @Prop({ type: String })
  restore_form_data: string;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
}
export const ManageBankSchema = SchemaFactory.createForClass(ManageBank);
ManageBankSchema.index({ country: 'text' });
