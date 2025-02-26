/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HomeCmDocuments = HomeCm & Document;

@Schema({ timestamps: true, collection: 'home-cms' })
export class HomeCm {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  slug: string;

  @Prop({ type: String, required: true, enum: ['file', 'text'] })
  type: string;

  @Prop({ type: String, default: null })
  image: string;

  @Prop({ type: String, length: 255 })
  description: string;

  @Prop({ type: String, required: true, enum: ['Active', 'Deactive'] })
  status: string;

  @Prop({ type: Number })
  index: number;
}
export const HomeCmSchema = SchemaFactory.createForClass(HomeCm);
HomeCmSchema.index({ type: 'text', status: 'text', index: 'text' });
