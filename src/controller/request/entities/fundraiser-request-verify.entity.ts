/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type FundraiserVerifyDocument = FundraiserVerify & Document;

@Schema({ timestamps: true, collection: 'fundraiser_verify' })
export class FundraiserVerify {
  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: SchemaTypes.ObjectId , required: true })
  request_id: string;

  @Prop({ type: Array, required: true })
  form_settings: [];

  @Prop({ type: Boolean })
  allow_for_reverify: boolean;

  @Prop({ type: Boolean })
  block_request: boolean;

  @Prop({ type: String })
  other_reason: string;
}

export const FundraiserVerifySchema =
  SchemaFactory.createForClass(FundraiserVerify);
  FundraiserVerifySchema.index({ request_id:'text' })
