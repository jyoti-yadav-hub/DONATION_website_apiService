/* eslint-disable prettier/prettier */
import {
    Document,
    ObjectId,
    SchemaTypes,
} from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type CourseDiseaseDocument = CourseDisease & Document;

@Schema({ timestamps: true, collection: 'course-disease' })
export class CourseDisease {

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true, enum: ['Course', 'Disease']})
    type: string;

    @Prop({ type: String, required: true })
    createdBy: string;

    @Prop({ type: String, required: true })
    updatedBy: string;
}

export const CourseDiseaseSchema = SchemaFactory.createForClass(CourseDisease);
CourseDiseaseSchema.index({ name: 'text', type: 'text' });
