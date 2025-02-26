/* eslint-disable prettier/prettier */
import {
    Document,
    ObjectId,
    SchemaTypes,
} from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CurrencyDocument = CurrencyModel & Document;

@Schema({ timestamps: true, collection: 'currency' })
export class CurrencyModel {

    @Prop({ type: String, required: true })
    country: string;

    @Prop({ type: String, required: true })
    status: string;

    @Prop({ type: String, required: true })
    country_code: string;

    @Prop({ type: Array, required: true })
    currency: [];

    @Prop({ type: String, required: true })
    emoji: string;

    @Prop({ type: String })
    region: string;

    @Prop({ type: Boolean })
    selected: boolean;

    @Prop({ type: String, required: true })
    createdBy: string;

    @Prop({ type: String })
    updatedBy: string;
}

export const CurrencySchema = SchemaFactory.createForClass(CurrencyModel);
CurrencySchema.index({ country: 'text', country_code: 'text' });
