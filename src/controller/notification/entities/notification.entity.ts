/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  request_user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  bank_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  corporate_id: ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Boolean })
  is_send: boolean;

  // @Prop({ type: Array, default: [] })
  // uuid: [];

  @Prop({ type: String })
  request_id: string;

  @Prop({ type: String })
  fund_id: string;

  @Prop({ type: String })
  reference_id: string;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: Boolean, default: false })
  is_read: boolean;

  @Prop({ type: String })
  category_slug: string;

  @Prop({ type: String })
  ngo_id: string;

  @Prop({ type: Object })
  additional_data: object;

  @Prop({ type: Boolean })
  received_from_admin: boolean;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({
  request_id: 'text',
  user_id: 'text',
  is_read: 'text',
  is_deleted: 'text',
});
