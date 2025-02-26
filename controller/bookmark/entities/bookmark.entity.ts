/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type BookmarkDocument = Bookmark & Document;

@Schema({ timestamps: true, collection: 'bookmark' })
export class Bookmark {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;
}
export const BookmarkSchema = SchemaFactory.createForClass(Bookmark);
