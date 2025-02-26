import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CorporateTypeDocument = CorporateType & Document;

@Schema({ timestamps: true, collection: 'corporate_types' })
export class CorporateType {
  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  slug: string;

  @Prop({ type: String })
  icon: string;

  @Prop({ type: String, enum: ['Active', 'Deactive'] })
  status: string;

  @Prop({ type: String })
  form_settings: string;

  @Prop({ type: Number })
  index: number;

  @Prop({ type: Boolean, default: false })
  coming_soon: boolean;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: String })
  restore_form_data: string;
}

export const CorporateTypeSchema = SchemaFactory.createForClass(CorporateType);
