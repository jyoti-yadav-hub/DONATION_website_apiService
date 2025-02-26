/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type UserTokenDocument = UserToken & Document;

@Schema({ timestamps: true, collection: 'user-token' })
export class UserToken {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: String, required: true })
  access_token: string;

  @Prop({ type: String, default: [] })
  uuid: string;

  @Prop({ type: String, required: true })
  platform: string;

  @Prop({ type: Date, required: true })
  expiry_date: Date;

  @Prop({ type: String, default: 'user' })
  active_role: string;
}
export const UserTokenSchema = SchemaFactory.createForClass(UserToken);
