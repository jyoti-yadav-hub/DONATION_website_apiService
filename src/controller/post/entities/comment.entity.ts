/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type CommentDocument = CommentModel & Document;

@Schema({ timestamps: true, collection: 'post_comments' })
export class CommentModel {
  @Prop({ type: String })
  parent_id: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: String })
  comment: string;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({
    type: String,
    required: true,
    enum: ['like', 'comment'],
  })
  type: string;

  @Prop({ type: SchemaTypes.ObjectId })
  post_id: ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(CommentModel);
CommentSchema.index({ post_id: 'text', type: 'text' });
