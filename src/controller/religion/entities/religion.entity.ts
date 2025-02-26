/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ReligionDocument = Religion & Document;
@Schema({ timestamps: true })
export class Religion {
    @Prop({ type: String, required: true })
    religion: string;
}
export const ReligionSchema = SchemaFactory.createForClass(Religion);
