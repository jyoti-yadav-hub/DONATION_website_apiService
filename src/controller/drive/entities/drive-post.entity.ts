import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type PostDocument = Post & Document;
@Schema({ timestamps: true, collection: 'drive_post' })
export class Post {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  drive_id: ObjectId;

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

  @Prop({ type: Date })
  cancelled_time: Date;

  @Prop({ type: String })
  cancelled_reason: string;

  @Prop({ type: Array })
  report_post: [];
}
export const PostSchema = SchemaFactory.createForClass(Post);
PostSchema.index({ user_id: 1, drive_id: 1 });
