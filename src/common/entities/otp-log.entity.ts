import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpLogDocument = OtpLog & Document;

@Schema({ timestamps: true, collection: 'otp_logs' })
export class OtpLog {
  @Prop({ type: String, required: true })
  api: string;

  @Prop({ type: Object })
  body: object;

  @Prop({ type: Object })
  response: object;

  @Prop({ type: Boolean })
  success: boolean;

  @Prop({ type: String, length: 255 })
  error_path: string;

  @Prop({ type: String })
  error_file: string;

  @Prop({ type: String })
  ip: string;
}
export const OtpLogSchema = SchemaFactory.createForClass(OtpLog);
