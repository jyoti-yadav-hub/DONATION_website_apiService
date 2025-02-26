/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NgoPostDocument = NgoPost & Document;

@Schema({ timestamps: false, collection: 'ngo_post' })
export class NgoPost {
  @Prop({ type: SchemaTypes.ObjectId })
  ngo_id: ObjectId;

  @Prop({ type: String })
  description: string;

  @Prop({ type: SchemaTypes.ObjectId })
  user_id: ObjectId;

  @Prop({ type: Array, default: [] })
  photos: [];
}
export const NgoPostSchema = SchemaFactory.createForClass(NgoPost);
NgoPostSchema.index({
  ngo_id: 'text',
  user_id: 'text',
});

