/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type RequestLogDocument = RequestLog & Document;

@Schema({ timestamps: true, collection: 'request-log' })
export class RequestLog {
  @Prop({ type: String, required: true })
  text: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Date })
  time: Date;

  @Prop({ type: SchemaTypes.ObjectId })
  request_id: ObjectId;
}

export const RequestLogSchema = SchemaFactory.createForClass(RequestLog);
RequestLogSchema.index({ request_id: 1 });
