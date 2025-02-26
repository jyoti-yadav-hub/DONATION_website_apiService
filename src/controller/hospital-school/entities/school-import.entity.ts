import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SchoolImportDocument = SchoolImport & Document;
@Schema({ timestamps: true, collection: 'hospitals-schools' })
export class SchoolImport {
  @Prop({ type: String, required: true, enum: ['Hospital', 'School'] })
  type: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: Object, required: true })
  location: {
    type: {};
    coordinates: [number];
    city: string;
  };

  @Prop({ type: Array, required: true })
  courses_or_diseases: [];

  @Prop({ type: String, required: true })
  finance_contact_name: string;

  @Prop({ type: String, required: true })
  finance_contact_number: string;

  @Prop({ type: String, required: true })
  finance_contact_email: string;

  @Prop({ type: String, required: true })
  finance_contact_country_code: string;

  @Prop({ type: String, required: true })
  escalation_contact_name: string;

  @Prop({ type: String, required: true })
  escalation_contact_number: string;

  @Prop({ type: String, required: true })
  escalation_contact_country_code: string;

  @Prop({ type: String, required: true })
  escalation_contact_email: string;

  @Prop({ type: String })
  state: string;

  @Prop({ type: String, required: true })
  website: string;

  @Prop({ type: Number, required: true })
  establishment_year: number;

  @Prop({ type: String })
  management: string;

  @Prop({ type: String })
  admission_contact_name: string;

  @Prop({ type: String })
  admission_contact_number: string;

  @Prop({ type: String })
  admission_contact_country_code: string;

  @Prop({ type: String })
  admission_contact_email: string;

  @Prop({ type: Array })
  academic: [];

  @Prop({ type: Array })
  instruction_medium: [];

  @Prop({ type: Number })
  no_of_teachers: number;

  @Prop({ type: Number })
  no_of_students: number;

  @Prop({ type: String })
  board: string;

  @Prop({ type: String })
  school_college_type: string;

  @Prop({ type: Boolean })
  is_draft: boolean;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;
}
export const SchoolImportSchema =
  SchemaFactory.createForClass(SchoolImport);
  SchoolImportSchema.index({ type: 'text', country: 'text' });
