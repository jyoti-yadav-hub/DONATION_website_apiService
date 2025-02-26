/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type LanguageDocument = Language & Document;
@Schema({ timestamps: true })
export class Language {
    @Prop({ type: String, required: true })
    language: string;

    @Prop({ type: String, required: true })
    language_specific_name: string;

    @Prop({ type: Array })
    country_code: [];

    @Prop({ type: String, required: true, enum: ['Active', 'Deactive'] })
    status: string;  

    @Prop({ type: String, required: true })
    createdBy: string;

    @Prop({ type: String, required: true })
    updatedBy: string;
}
export const LanguageSchema = SchemaFactory.createForClass(Language);
