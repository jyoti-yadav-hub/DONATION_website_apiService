/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
export type ReportDocument = Report & Document;
@Schema({ timestamps: true })
export class Report {
    @Prop({ type: String, required: true })
    form_data: string;

    @Prop({ type: String, required: true })
    type: string;
}
export const ReportSchema = SchemaFactory.createForClass(Report);
