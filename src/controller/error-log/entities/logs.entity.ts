/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogsDocument = Logs & Document;

@Schema({ timestamps: true, collection: 'logs' })
export class Logs {
    @Prop({ type: String })
    log_name: string;

    @Prop({ type: Object })
    data: object;
}
export const LogsSchema = SchemaFactory.createForClass(Logs);