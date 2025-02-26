/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  slug: string;

  @Prop({ type: String })
  icon: string;

  @Prop({ type: String })
  web_icon: string;

  @Prop({ type: String, length: 255 })
  description: string;

  @Prop({ type: String, default: 'Active' })
  status: string;

  @Prop({ type: Number })
  index: number;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
RoleSchema.index({
  name: 'text',
  status: 'text'
});
