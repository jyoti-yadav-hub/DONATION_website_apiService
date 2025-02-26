import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type adminTokenDocument = adminToken & Document;

@Schema({ collection: 'admin-token' })
export class adminToken {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  admin_id: ObjectId;

  @Prop({ type: String, required: true })
  fcm_token: string;
}
export const adminTokenSchema = SchemaFactory.createForClass(adminToken);
adminTokenSchema.index({ fcm_token: 1 });