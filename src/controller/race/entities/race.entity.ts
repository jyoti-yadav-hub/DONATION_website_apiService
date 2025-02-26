/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type RaceDocument = Race & Document;
@Schema({ timestamps: true })
export class Race {
    @Prop({ type: String, required: true })
    race: string;
}
export const RaceSchema = SchemaFactory.createForClass(Race);
RaceSchema.index({ race: 'text' });

