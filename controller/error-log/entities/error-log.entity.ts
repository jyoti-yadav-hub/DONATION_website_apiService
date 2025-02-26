import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type ErrorLogDocument = ErrorLog & Document;

@Schema({ timestamps: true, collection: 'error_logs' })
export class ErrorLog {
  @Prop({ type: String, required: true })
  error_name: string;

  @Prop({ type: String, required: true })
  error_message: string;

  @Prop({ type: String, length: 255, required: true })
  error_path: string;

  @Prop({ type: String, required: true })
  error_file: string;

  @Prop({ type: Object })
  body: object;

  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: SchemaTypes.ObjectId })
  api_log_id: ObjectId;
}
export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);
