/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type JobTitleDocument = JobTitle & Document;
@Schema({ timestamps: true, collection: 'job_title' })
export class JobTitle {
  @Prop({ type: String, required: true })
  job_title: string;

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;
  
  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;
}
export const JobTitleSchema = SchemaFactory.createForClass(JobTitle);
