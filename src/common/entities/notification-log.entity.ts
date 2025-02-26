import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationLogDocument = NotificationLog & Document;

@Schema({ timestamps: true, collection: 'notification_logs' })
export class NotificationLog {

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
export const NotificationLogSchema = SchemaFactory.createForClass(NotificationLog);
