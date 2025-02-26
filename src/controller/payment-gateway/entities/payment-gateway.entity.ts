import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentGatewayDocument = PaymentGateway & Document;

@Schema({ timestamps: true, collection: 'payment-gateway'})
export class PaymentGateway {
  @Prop({ type: String, required: true })
  name: string;
  
  @Prop({ type: String, required: true })
  form_settings: string;

  @Prop({ type: Object, required: true })
  form_fields: object;
}
export const PaymentGatewaySchema = SchemaFactory.createForClass(PaymentGateway);
PaymentGatewaySchema.index({ name: 'text' });
