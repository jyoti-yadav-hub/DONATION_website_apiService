import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type AdminLogDocument = AdminLog & Document;

@Schema({ timestamps: true, collection: 'admin_log' })
export class AdminLog {
  @Prop({ required: true, type: String })
  description: string;

  @Prop({ type: String })
  action: string;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  entity_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  request_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  fund_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  drive_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  ngo_id: ObjectId;

  @Prop({ type: String })
  entity_name: string;

  @Prop({ type: String })
  admin_name: string;

  @Prop({ type: String })
  admin_email: string;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  admin_id: ObjectId;

  @Prop({ type: String })
  ip: string;
}
export const AdminLogSchema = SchemaFactory.createForClass(AdminLog);
AdminLogSchema.index({ admin_id: 1, entity_id: 1 });
