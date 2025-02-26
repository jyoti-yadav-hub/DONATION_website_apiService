/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type LastDonorNotificationDocument = LastDonorNotificationModel & Document;

@Schema({ timestamps: true, collection: 'last-donor-notification' })
export class LastDonorNotificationModel {


    @Prop({ type: SchemaTypes.ObjectId })
    user_id: ObjectId;

    @Prop({ type: SchemaTypes.ObjectId })
    request_id: ObjectId;

    @Prop({ type: Date })
    next_date: Date;
}
export const LastDonorNotificationSchema = SchemaFactory.createForClass(LastDonorNotificationModel);
LastDonorNotificationSchema.index({ user_id: 'text', request_id: 'text' });

