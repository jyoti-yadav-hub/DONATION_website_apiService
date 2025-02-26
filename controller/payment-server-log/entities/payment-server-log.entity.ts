/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentServerLogDocument = PaymentServerLog & Document;

@Schema({ timestamps: true, collection: 'payment_server_logs' })
export class PaymentServerLog {
  @Prop({ type: Object })
  request: object;
}
export const PaymentServerLogSchema =
  SchemaFactory.createForClass(PaymentServerLog);
