/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type CorporateNotificationDocument = CorporateNotification & Document;

@Schema({ timestamps: true, collection: 'corporate_notification' })
export class CorporateNotification {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  corporate_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  request_user_id: ObjectId;

  @Prop({ type: String })
  request_id: string;

  @Prop({ type: String })
  category_slug: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: Boolean , default: false })
  is_read: boolean;

  @Prop({ type: Object })
  additional_data: object;

}
export const CorporateNotificationSchema = SchemaFactory.createForClass(CorporateNotification);
CorporateNotificationSchema.index({user_id: 'text', is_read: 'text', is_deleted: 'text' });
