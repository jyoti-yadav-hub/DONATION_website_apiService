/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  ObjectId,
  Schema as MongooseSchema,
  SchemaTypes,
} from 'mongoose';

export type RequestHistoryDocument = RequestHistoryModel & Document;

@Schema({ collection: 'requests_history' })
export class RequestHistoryModel {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  request_id: ObjectId;

  @Prop({ type: Object })
  form_data: object;

  @Prop({ type: Object })
  location: object;

  @Prop({ type: String })
  previous_status: string;
}

export const RequestHistorySchema =
  SchemaFactory.createForClass(RequestHistoryModel);
RequestHistorySchema.index({ request_id: 1 });
