import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type PostDocument = PostModel & Document;
@Schema({ timestamps: true, collection: 'post' })
export class PostModel {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  request_id: ObjectId;

  @Prop({ type: String })
  request_type: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Array, default: [] })
  photos: [];

  @Prop({ type: String })
  block_reason: string;

  @Prop({ type: Date })
  block_time: Date;

  @Prop({ type: Boolean })
  is_blocked: boolean;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: Date })
  cancelled_time: Date;

  @Prop({ type: String })
  cancelled_reason: string;

  @Prop({ type: Array })
  report_post: [];
}
export const PostSchema = SchemaFactory.createForClass(PostModel);
PostSchema.index({ request_id: 1, user_id: 1, request_type: 1 });
