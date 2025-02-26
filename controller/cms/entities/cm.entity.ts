import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CmsDocument = Cms & Document;

@Schema({ timestamps: true })
export class Cms {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  slug: string;

  @Prop({ type: String, length: 255, required: true })
  description: string;

  @Prop({ type: String, required: true, enum: ['Active', 'Deactive'] })
  status: string;

  @Prop({ type: String, required: true })
  screen_name: string;

  @Prop({ type: String, length: 255, required: true })
  usage: string;
}
export const CmsSchema = SchemaFactory.createForClass(Cms);
CmsSchema.index({ slug: 'text', status: 'text' });
