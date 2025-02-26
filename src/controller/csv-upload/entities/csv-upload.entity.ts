/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, ObjectId, SchemaTypes } from 'mongoose';

export type CsvUploadDocument = CsvUploadModel & Document;

@Schema({ timestamps: true, collection: 'csv-upload' })
export class CsvUploadModel {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  file_name: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, required: true })
  uploadedBy: string;

  @Prop({ type: Array })
  failed_rows: [];

  @Prop({ type: Boolean, default: false })
  imported: boolean;

  @Prop({ type: SchemaTypes.ObjectId })
  entity_id: ObjectId;

  @Prop({ type: SchemaTypes.ObjectId })
  user_id: ObjectId;
}

export const CsvUploadSchema = SchemaFactory.createForClass(CsvUploadModel);
CsvUploadSchema.index({ title: 'text' });
