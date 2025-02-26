/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
    Document,
} from 'mongoose';

export type BankTypeDocument = BankType & Document;

@Schema({ timestamps: true, collection: 'bank_type' })
export class BankType {
    @Prop({ type: String, required: true})
    country: string;

    @Prop({ type: String, required: true })
    bank_name: string;

}
export const BankTypeSchema = SchemaFactory.createForClass(BankType);
