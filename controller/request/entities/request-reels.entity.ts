/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type RequestReelsDocument = RequestReels & Document;

@Schema({ timestamps: true, collection: 'request-reels' })
export class RequestReels {
  @Prop({ type: SchemaTypes.ObjectId })
  request_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  user_id: ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Array, default: [] })
  views_user_ids: [];

  @Prop({ type: Array })
  like_user_ids: [];

  @Prop({ type: String, required: true })
  video_type: string;

  @Prop({ type: String })
  status: string;

}

export const RequestReelsSchema = SchemaFactory.createForClass(RequestReels);
