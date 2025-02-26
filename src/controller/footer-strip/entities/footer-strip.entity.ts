/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, SchemaTypes } from 'mongoose';

export type FooterStripDocument = FooterStripModel & Document;

@Schema({ timestamps: true, collection: 'footer-strip' })
export class FooterStripModel {
  @Prop({ type: String, required: true })
  outer_title: string;

  @Prop({ type: String, required: true })
  outer_description: string;

  @Prop({ type: String })
  inner_title: string;

  @Prop({ type: String })
  inner_description: string;

  @Prop({ type: String, required: true })
  slug: string;

  @Prop({ type: String })
  url: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  updatedBy: string;
}

export const FooterStripSchema = SchemaFactory.createForClass(FooterStripModel);
FooterStripSchema.index({ title: 'text', slug: 'text' });
