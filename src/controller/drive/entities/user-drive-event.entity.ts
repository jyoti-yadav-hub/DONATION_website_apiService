import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type UserDriveEventDocument = UserDriveEvent & Document;
@Schema({ timestamps: true, collection: 'drive_user_event' })
export class UserDriveEvent {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  drive_id: ObjectId;

  @Prop({ type: String, required: true })
  event_id: string;

  @Prop({ type: String, required: true })
  unique_id: string;
}
export const UserDriveEventSchema =
  SchemaFactory.createForClass(UserDriveEvent);
UserDriveEventSchema.index({ user_id: 'text', drive_id: 'text' });
