/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ImageDocument = Image & Document;

@Schema({ timestamps: true })
export class Image {
  @Prop({ type: Number, required: true })
  index: number;

  @Prop({ type: String, required: true })
  view_type: string;

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  updatedBy: string;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
