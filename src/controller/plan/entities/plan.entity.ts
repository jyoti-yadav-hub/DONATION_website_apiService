/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
    Document,
    Schema as MongooseSchema,
    SchemaTypes,
} from 'mongoose';

export type PlanDocument = PlanModel & Document;

@Schema({ timestamps: true, collection: 'plans'})
export class PlanModel {
    @Prop({ type: String, required: true })
    title: string;

    @Prop({ type: String, required: true })
    description: string;

    @Prop({ type: Number })
    duration: number;

    @Prop({ type: String, required: true })
    duration_type: string;

    @Prop({ type: Number, required: true })
    amount: number;

    @Prop({ type: String })
    status: string;

    @Prop({ type: String, required: true })
    createdBy: string;

    @Prop({ type: String, required: true })
    updatedBy: string;
    
}

export const PlanSchema = SchemaFactory.createForClass(PlanModel);
PlanSchema.index({ title: 'text', status: 'text' });
