/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ExchangeRatesDocument = ExchangeRates & Document;

@Schema({ collection: 'exchange-rates' })
export class ExchangeRates {
  @Prop({ type: String })
  currency: string;

  @Prop({ type: Object })
  rates: object;

  @Prop({ type: Date, default: new Date() })
  createdAt: Date;

  @Prop({ type: Date, default: new Date() })
  updatedAt: Date;
}

export const ExchangeRatesSchema = SchemaFactory.createForClass(ExchangeRates);
ExchangeRatesSchema.index({
  currency: 'text',
});
