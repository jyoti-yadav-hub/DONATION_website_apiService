/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SocialDataDocument = SocialData & Document;

@Schema({ timestamps: true, collection: 'social-data' })
export class SocialData {
    @Prop({ type: Object, required: true })
    data: object;
}
export const SocialDataSchema = SchemaFactory.createForClass(SocialData);
