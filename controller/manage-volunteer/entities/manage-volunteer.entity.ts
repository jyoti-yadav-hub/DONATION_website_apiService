/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ManageVolunteerDocument = ManageVolunteer & Document;

@Schema({ timestamps: true, collection: 'manage_volunteer' })
export class ManageVolunteer {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  request_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  volunteer_id: ObjectId;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: Boolean })
  invite_volunteer: boolean;

  @Prop({ type: Boolean })
  manage_volunteer: boolean;

  @Prop({ type: Boolean })
  edit_fundraiser: boolean;

  @Prop({ type: Date })
  block_time: Date;
}

export const ManageVolunteerSchema = SchemaFactory.createForClass(ManageVolunteer);
