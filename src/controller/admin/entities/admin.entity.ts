import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  @Prop({ type: String })
  image: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, unique: true, type: String })
  email: string;

  @Prop({ required: true, type: String })
  role: string;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ required: true, type: String })
  password: string;

  @Prop({ type: String })
  token: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  updatedBy: string;

  @Prop({ type: String })
  fcm_token: string;

  @Prop({ type: Number })
  expired_at: number;
}
export const AdminSchema = SchemaFactory.createForClass(Admin);
AdminSchema.index({ email: 1, password: 1 });
