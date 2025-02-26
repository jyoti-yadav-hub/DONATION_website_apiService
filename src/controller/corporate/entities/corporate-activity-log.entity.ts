import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type CorporateActivityLogDocument = CorporateActivityLog & Document;

@Schema({ timestamps: true, collection: 'corporate_activity_log' })
export class CorporateActivityLog {
  @Prop({ required: true, type: String })
  description: string;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  corporate_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  user_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  request_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  fund_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, index: true })
  drive_id: ObjectId;

  @Prop({ type: String })
  ip: string;
}
export const CorporateActivityLogSchema =
  SchemaFactory.createForClass(CorporateActivityLog);
CorporateActivityLogSchema.index({
  user_id: 1,
  corporate_id: 1,
  request_id: 1,
  fund_id: 1,
  drive_id: 1,
  entity_id: 1,
});
