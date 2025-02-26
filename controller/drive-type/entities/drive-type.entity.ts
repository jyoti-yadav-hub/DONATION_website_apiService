import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type DriveTypeDocument = DriveType & Document;
@Schema({ timestamps: true, collection: 'drive-types' })
export class DriveType {
  @Prop({ type: String, required: true })
  drive_type: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;

  @Prop({ type: Boolean })
  is_deleted: boolean;

  @Prop({ type: Date })
  deletedAt: Date;
}
export const DriveTypeSchema = SchemaFactory.createForClass(DriveType);
DriveTypeSchema.index({
  drive_type: 'text',
  status: 'text',
  is_deleted: 'text',
});
