/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type TransferOwnershipDocument = TransferOwnership & Document;

@Schema({ timestamps: false, collection: 'ngo_updated_data' })
export class TransferOwnership {

    @Prop({ type: String })
    transfer_user_id: string;

    @Prop({ type: String })
    ngo_id: string;

    @Prop({ type: String })
    ngo_name: string;

    @Prop({ type: String })
    transfer_reason: string;

    @Prop({ type: Array })
    transfer_documents: [];

    @Prop({ type: String })
    transfer_status: string;

    @Prop({ type: Boolean })
    transfer_account_request: boolean;

    @Prop({ type: Boolean })
    transfer_account: boolean;

}
export const TransferOwnershipSchema = SchemaFactory.createForClass(TransferOwnership);
TransferOwnershipSchema.index({ ngo_id:1, transfer_user_id:1})
