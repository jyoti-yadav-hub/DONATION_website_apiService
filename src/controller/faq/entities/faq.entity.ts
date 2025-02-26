/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  ObjectId,
  SchemaTypes,
  Schema as MongooseSchema,
} from 'mongoose';

export type FaqDocument = Faq & Document;

@Schema({ timestamps: true, collection: 'faq' })
export class Faq {
  @Prop({ type: String, required: true })
  question: string;

  @Prop({ type: String, required: true })
  answer: string;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;
}
export const FaqSchema = SchemaFactory.createForClass(Faq);
