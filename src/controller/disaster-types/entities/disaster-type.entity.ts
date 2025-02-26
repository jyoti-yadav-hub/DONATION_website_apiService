import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type DisasterTypeDocument = DisasterType & Document;
@Schema({ timestamps: true, collection: 'disaster_types' })
export class DisasterType {
  @Prop({ type: String, required: true })
  disaster_type: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;

  @Prop({ type: Boolean })
  is_deleted: boolean;
}
export const DisasterTypeSchema = SchemaFactory.createForClass(DisasterType);
DisasterTypeSchema.index({ disaster_type: 'text' });
