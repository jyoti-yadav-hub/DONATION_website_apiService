/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: String, default: 0 })
  parent_id: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  comment: string;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({
    type: String,
    required: true,
    enum: ['drive', 'request', 'ngo', 'drive-like', 'ngo-post-like'],
  })
  type: string;

  @Prop({ type: SchemaTypes.ObjectId })
  post_id: ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.index({
  user_id: 'text',
  is_deleted: 'text',
  type: 'text',
  post_id: 'text',
});
