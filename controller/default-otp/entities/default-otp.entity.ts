import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  ObjectId,
  SchemaTypes,
  Schema as MongooseSchema,
} from 'mongoose';

export type DefaultOtpDocument = DefaultOtp & Document;

@Schema({ timestamps: true, collection: 'default_otp' })
export class DefaultOtp {
  @Prop({ type: String, required: true })
  phone_code: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String })
  app_otp: string;

  @Prop({ type: Number })
  web_otp: number;

  @Prop({ type: Boolean, default: false })
  is_default: boolean;
}
export const DefaultOtpSchema = SchemaFactory.createForClass(DefaultOtp);
DefaultOtpSchema.index({ phone: 1 });
