/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NgoTeamMemberDocument = NgoTeamMember & Document;

@Schema({ timestamps: true, collection: 'ngo_team_member' })
export class NgoTeamMember {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  ngo_id: ObjectId;

  @Prop({ type: String, required: true })
  phone_code: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String })
  image: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  position: string;

  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: Boolean })
  is_deleted: boolean;
}
export const NgoTeamMemberSchema = SchemaFactory.createForClass(NgoTeamMember);
NgoTeamMemberSchema.index({
  ngo_id: 'text',
});

