/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  ObjectId,
  SchemaTypes,
  Schema as MongooseSchema,
} from 'mongoose';

export type BankDocument = Bank & Document;

@Schema({ timestamps: true, collection: 'bank' })
export class Bank {
  @Prop({ type: SchemaTypes.ObjectId, required: true, index: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  ngo_id: ObjectId;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: Date })
  approve_time: Date;

  @Prop({ type: String })
  reject_reason: string;

  @Prop({ type: Date })
  reject_time: Date;

  @Prop({ type: Object, required: true })
  form_data: object;

  @Prop({ type: String, required: true })
  form_settings: string;

  @Prop({ type: String, required: true, index: true })
  country: string;

  @Prop({ type: String, required: true, index: true })
  country_code: string;
}
export const BankSchema = SchemaFactory.createForClass(Bank);
BankSchema.index({ ngo_id: 'text', user_id: 'text', country: 'text' });
