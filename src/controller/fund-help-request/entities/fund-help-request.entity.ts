/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type FundHelpRequestDocument = FundHelpRequest & Document;

@Schema({ timestamps: true, collection: 'fund_help_request' })
export class FundHelpRequest {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  fund_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  request_id: ObjectId;

  @Prop({ type: String, required: true })
  reason: string;

}

export const FundHelpRequestSchema =
  SchemaFactory.createForClass(FundHelpRequest);
