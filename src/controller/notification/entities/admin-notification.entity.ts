/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type AdminNotificationDocument = AdminNotification & Document;

@Schema({ timestamps: true, collection: "admin-notifications" })
export class AdminNotification {
    @Prop({ type: SchemaTypes.ObjectId, required: true })
    user_id: ObjectId;

    @Prop({ type: String, required: true })
    title: string;

    @Prop({ type: String, required: true })
    message: string;

    @Prop({ type: String })
    type: string;

    @Prop({ type: Boolean })
    is_deleted: boolean;

    @Prop({ type: Boolean, default: false })
    is_read: boolean;

    @Prop({ type: Array, default: null })
    uuid: [];

    @Prop({ type: String })
    request_id: string;

    @Prop({ type: String })
    fund_id: string;

    @Prop({ type: String })
    corporate_id: string;

    @Prop({ type: String })
    category_slug: string;

    @Prop({ type: String })
    ngo_id: string;

    @Prop({ type: Object })
    additional_data: object
}
export const AdminNotificationSchema = SchemaFactory.createForClass(AdminNotification);
AdminNotificationSchema.index({ title: 'text', user_id: 'text', is_deleted: 'text'});
