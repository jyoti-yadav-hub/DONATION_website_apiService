/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LogDocument = Log & Document;

@Schema({ timestamps: true, collection: 'api-logs' })
export class Log {
  @Prop({ type: String })
  api: string;

  @Prop({ type: String })
  method: string;

  @Prop({ type: Object })
  data: object;
}
export const LogSchema = SchemaFactory.createForClass(Log);
