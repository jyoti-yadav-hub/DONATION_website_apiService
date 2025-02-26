import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type CorporateInviteDocument = CorporateInvite & Document;

@Schema({ timestamps: true, collection: 'corporate_invite' })
export class CorporateInvite {
  @Prop({ type: String })
  first_name: string;

  @Prop({ type: String })
  last_name: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  phone_code: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  corporate_id: string;

  @Prop({
    type: String,
    enum: ['upload_csv', 'email_invite', 'send_invite'],
  })
  type: string;
}
export const CorporateInviteSchema =
  SchemaFactory.createForClass(CorporateInvite);
CorporateInviteSchema.index({
  phone: 1,
  email: 1,
  phone_code: 1,
  corporate_id: 1,
});
