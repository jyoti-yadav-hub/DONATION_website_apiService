/* eslint-disable prettier/prettier */
import {
    Document,
    ObjectId,
    SchemaTypes,
} from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type AdminTransactionDocument = AdminTransactionModel & Document;

@Schema({ timestamps: true, collection: 'admin-transactions' })
export class AdminTransactionModel {

    @Prop({ type: SchemaTypes.ObjectId })
    user_id: ObjectId;

    @Prop({ type: SchemaTypes.ObjectId })
    request_id: ObjectId;

    @Prop({ type: SchemaTypes.ObjectId })
    ngo_id: ObjectId;

    @Prop({ type: Number })
    goal_amount: number; 

    @Prop({ type: Number })
    total_donation: number; 

    @Prop({ type: Number })
    remaining_amount: number;

    @Prop({ type: Number })
    transfer_amount: number;

    @Prop({ type: Number })
    amount: number;

    @Prop({ type: String, required: true })
    receipt_number: string;

    @Prop({ type: String })
    currency: string;

    @Prop({ type: String })
    currency_code: string;

    @Prop({ type: String })
    receipt_image: string;

    @Prop({ type: Date})
    transfer_date: Date;

    @Prop({ type: Object })
    response: {};
    
    @Prop({ type: String })
    reference_id:string

    @Prop({ type: Boolean })
    manual_transfer:boolean

    @Prop({ type: Boolean })
    manual_transaction:boolean

    @Prop({ type: String, required: true })
    status:string
}

export const AdminTransactionSchema = SchemaFactory.createForClass(AdminTransactionModel);
AdminTransactionSchema.index({ request_id: 'text', reference_id: 'text', user_id: 'text'});
