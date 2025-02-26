/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NgoCertificateDocument = NgoCertificate & Document;

@Schema({ timestamps: true, collection: 'ngo-certificate' })
export class NgoCertificate {
    @Prop({ type: SchemaTypes.ObjectId, required: true })
    ngo_id: ObjectId;

    @Prop({ type: String })
    ngo_deed: string;

    @Prop({ type: String })
    ngo_certificate: string;

    @Prop({ type: Date })
    expiry_date: Date;

    @Prop({ type: String, default: "pending" })
    status: string;

    @Prop({ type: String })
    reason: string;
}
export const NgoCertificateSchema = SchemaFactory.createForClass(NgoCertificate);
NgoCertificateSchema.index({ ngo_id: 'text', index: 'text' });
