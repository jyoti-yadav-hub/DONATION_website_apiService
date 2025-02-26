import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SmtpLogDocument = SmtpLog & Document;

@Schema({ timestamps: true, collection: 'smtp_logs' })
export class SmtpLog {
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
}
export const SmtpLogSchema = SchemaFactory.createForClass(SmtpLog);
