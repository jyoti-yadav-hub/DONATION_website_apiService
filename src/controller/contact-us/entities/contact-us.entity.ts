/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactUsDocument = ContactUs & Document;

@Schema({ timestamps: true, collection: 'contact_us' })
export class ContactUs {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  phone_code: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  message: string;
}
export const ContactUsSchema = SchemaFactory.createForClass(ContactUs);
