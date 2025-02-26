/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type FavouriteNgoDocument = FavouriteNgo & Document;

@Schema({ timestamps: true, collection: 'favourite-ngo' })
export class FavouriteNgo {
    @Prop({ type: SchemaTypes.ObjectId, required: true })
    ngo_id: ObjectId;

    @Prop({ type: SchemaTypes.ObjectId, required: true })
    user_id: ObjectId;

    @Prop({ type: Number })
    index: number;

    @Prop({ type: Boolean })
    is_deleted: boolean;
}
export const FavouriteNgoSchema = SchemaFactory.createForClass(FavouriteNgo);
FavouriteNgoSchema.index({ user_id: 'text', index: 'text', ngo_id:'text' });
