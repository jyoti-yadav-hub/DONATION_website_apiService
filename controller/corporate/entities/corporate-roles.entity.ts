import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type CorporateRolesDocument = CorporateRoles & Document;

@Schema({ timestamps: true, collection: 'corporate_roles' })
export class CorporateRoles {
  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: SchemaTypes.ObjectId })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  corporate_id: ObjectId;

  @Prop({ type: Array })
  permissions: [];
}
export const CorporateRolesSchema =
  SchemaFactory.createForClass(CorporateRoles);
CorporateRolesSchema.index({
  role: 'text',
  corporate_id: 'text',
  user_id: 'text',
});
