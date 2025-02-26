/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type ReelsDocument = Reels & Document;

@Schema({ timestamps: true })
export class Reels {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: Number, default: 0 })
    views_count: number;

    @Prop({ type: Array, default: [] })
    views_user_ids: [];

    @Prop({ type: Number, default: 0 })
    comment_count: number;

    @Prop({ type: Number, default: 0 })
    likes_count: number;

    @Prop({ type: Array, default: [] })
    like_user_ids: [];
}

export const ReelsSchema = SchemaFactory.createForClass(Reels);
