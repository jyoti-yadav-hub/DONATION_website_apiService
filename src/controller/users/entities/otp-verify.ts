import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type OtpVerifyDocument = OtpVerifyModel & Document;

@Schema({ timestamps: true, collection: 'otp_verify' })
export class OtpVerifyModel {
  @Prop({ type: String, required: true })
  phone_code: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: Number })
  app_otp_expired_at: number;

  @Prop({ type: Number })
  app_otp_resend_time: number;

  @Prop({ type: String })
  app_otp: string;

  @Prop({ type: Number })
  web_otp_expired_at: number;

  @Prop({ type: Number })
  web_otp_resend_time: number;

  @Prop({ type: String })
  web_otp: string;

  @Prop({ type: String })
  platform: string;

  @Prop({ type: Number })
  guest_otp: number;

  @Prop({ type: Boolean })
  is_default: boolean;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  updatedBy: string;
}
export const OtpVerifySchema = SchemaFactory.createForClass(OtpVerifyModel);
OtpVerifySchema.index({
  email: 'text',
  phone: 'text',
});
