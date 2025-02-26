/* eslint-disable prettier/prettier */
import { Document, ObjectId, SchemaTypes } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CurrencyRatesDocument = CurrencyRates & Document;

@Schema({ collection: 'currency_rates' })
export class CurrencyRates {
  @Prop({ type: String })
  currency: string;

  @Prop({ type: String })
  date: string;

  @Prop({ type: Object })
  rates: object;

  @Prop({ type: Date, default: new Date() })
  createdAt: Date;

  @Prop({ type: Date, default: new Date() })
  updatedAt: Date;
}

export const CurrencyRatesSchema = SchemaFactory.createForClass(CurrencyRates);
CurrencyRatesSchema.index({
  currency: 'text',
});
