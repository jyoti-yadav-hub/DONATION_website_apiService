/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiLogDocument = ApiLog & Document;

@Schema({ timestamps: true, collection: 'api_logs' })
export class ApiLog {
  @Prop({ type: String })
  api: string;

  @Prop({ type: String })
  method: string;

  @Prop({ type: Object })
  request: object;

  @Prop({ type: String })
  ip: string;

  @Prop({ type: String })
  originalUrl: string;

  @Prop({ type: Object })
  user: object;
}
export const ApiLogSchema = SchemaFactory.createForClass(ApiLog);
