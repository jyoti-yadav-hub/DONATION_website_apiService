import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type CorporateUsersDocument = CorporateUsers & Document;

@Schema({ timestamps: true, collection: 'corporate_users' })
export class CorporateUsers {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  corporate_id: ObjectId;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: Boolean, default: false })
  is_admin: boolean;

  @Prop({ type: SchemaTypes.ObjectId })
  role_id: ObjectId;
}
export const CorporateUsersSchema =
  SchemaFactory.createForClass(CorporateUsers);
CorporateUsersSchema.index({
  user_id: 'text',
  corporate_id: 'text',
});
