/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type FundraiserActivityLogDocument = FundraiserActivityLog & Document;

@Schema({ timestamps: true, collection: 'fundraiser_activity_log' })
export class FundraiserActivityLog {
    @Prop({ type: SchemaTypes.ObjectId  })
    user_id: ObjectId;

    @Prop({ type: SchemaTypes.ObjectId })
    request_id: ObjectId;

    @Prop({ type: String, required: true })
    text: string;
}

export const FundraiserActivityLogSchema = SchemaFactory.createForClass(FundraiserActivityLog);
FundraiserActivityLogSchema.index({ request_id:1 })
