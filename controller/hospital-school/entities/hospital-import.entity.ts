import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type HospitalImportDocument = HospitalImport & Document;
@Schema({ timestamps: true, collection: 'hospitals-schools' })
export class HospitalImport {
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

  @Prop({ type: String, required: true })
  hospital_area: string;

  @Prop({ type: String, required: true })
  types_of_hospital: string;

  @Prop({ type: Array, required: true })
  departments: [];

  @Prop({ type: Array, required: true })
  areas_served: [];

  @Prop({ type: Number, required: true })
  no_of_beds: number;

  @Prop({ type: Boolean, required: true })
  emergency_department: boolean;

  @Prop({ type: Boolean })
  is_draft: boolean;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;
}
export const HospitalImportSchema =
  SchemaFactory.createForClass(HospitalImport);
  HospitalImportSchema.index({ type: 'text', country: 'text' });
