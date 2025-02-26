import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type OtpVerifyDocument = OtpVerify & Document;

@Schema({ timestamps: true, collection: 'otp_verify' })
export class OtpVerify {
  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  otp: string;

  @Prop({ type: Number })
  expired_at: number;
}
export const OtpVerifySchema = SchemaFactory.createForClass(OtpVerify);
OtpVerifySchema.index({
  email: 'text',
});
