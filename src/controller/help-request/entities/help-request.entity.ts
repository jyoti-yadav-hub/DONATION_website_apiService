/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type HelpRequestDocument = HelpRequest & Document;

@Schema({ timestamps: true, collection: 'help-request' })
export class HelpRequest {
  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  phone_code: string;

  @Prop({ type: String, required: true })
  help_language: string;

  @Prop({ type: String, required: true })
  country_code: string;

  @Prop({ type: Array, default: [] })
  volunteer_id: any;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: Boolean })
  noVolunteer: boolean;

  @Prop({ type: String })
  audio: string;

  @Prop({ type: String })
  block_reason: string;

  @Prop({ type: String })
  unblock_reason: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: Date })
  complete_time: Date;

  @Prop({ type: Date })
  approve_time: Date;

  @Prop({ type: String })
  reject_reason: string;

  @Prop({ type: Date })
  reject_time: Date;

  @Prop({ type: String })
  report_benificiary: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Object, required: true })
  location: {
    type: {};
    coordinates: [number];
    city: string;
  };
}

export const HelpRequestSchema = SchemaFactory.createForClass(HelpRequest);
HelpRequestSchema.index({
  user_id: 'text',
  language: 'text',
  location: '2dsphere',
});
