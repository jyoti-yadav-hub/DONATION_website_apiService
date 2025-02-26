/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type BookmarkItemsDocument = BookmarkItems & Document;

@Schema({ timestamps: true, collection: 'bookmark_items' })
export class BookmarkItems {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  request_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: String, required: true })
  category_slug: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  collection_id: ObjectId;
}
export const BookmarkItemsSchema = SchemaFactory.createForClass(BookmarkItems);
BookmarkItemsSchema.index({ request_id: 1, user_id: 1, category_slug: 1 });
