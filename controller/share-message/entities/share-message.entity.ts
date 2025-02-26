/* eslint-disable prettier/prettier */
import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ShareMessageDocument = ShareMessage & Document;

@Schema({ timestamps: true, collection: 'share_message' })
export class ShareMessage {
  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String})
  causes: string;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;
  
}

export const ShareMessageSchema = SchemaFactory.createForClass(ShareMessage);
