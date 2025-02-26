import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type DriveDocument = Drive & Document;
@Schema({ timestamps: true })
export class Drive {
  @Prop({ type: String })
  reference_id: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: String, required: true })
  active_type: string;

  @Prop({ type: String, required: true })
  category_slug: string;

  @Prop({
    type: String,
    required: true,
    enum: [
      'draft',
      'approve',
      'ongoing',
      'reject',
      'waiting_for_verify',
      'cancel',
      'blocked',
    ],
  })
  status: string;

  @Prop({ type: Object, required: true })
  form_data: object;

  @Prop({ type: Object })
  location: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    type: {};
    coordinates: [number];
    city: string;
  };

  @Prop({ type: String })
  form_settings: string;

  @Prop({ type: String, required: true })
  country_code: string;

  @Prop({ type: Object })
  country_data: object;

  @Prop({ type: Date })
  approve_time: Date;

  @Prop({ type: Array, default: [] })
  contacts: [];

  @Prop({ type: Array, default: [] })
  volunteers: [];

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: String })
  block_reason: string;

  @Prop({ type: Date })
  block_time: Date;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Date })
  cancelled_time: Date;

  @Prop({ type: String })
  cancelled_reason: string;

  @Prop({ type: Array })
  fundraiser_ids: [];

  @Prop({ type: Array })
  fund_ids: [];

  @Prop({ type: Array })
  report_drive: [];

  @Prop({ type: Boolean })
  is_started: boolean;

  @Prop({ type: SchemaTypes.ObjectId })
  corporate_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  user_ngo_id: ObjectId;
}
export const DriveSchema = SchemaFactory.createForClass(Drive);
DriveSchema.index({ location: '2dsphere' });
DriveSchema.index({
  user_id: 'text',
  active_type: 'text',
  status: 'text',
  is_deleted: 'text',
});
