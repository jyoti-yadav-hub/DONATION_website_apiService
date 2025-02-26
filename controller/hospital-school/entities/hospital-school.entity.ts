import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type HospitalSchoolDocument = HospitalSchool & Document;
@Schema({ timestamps: true, collection: 'hospitals-schools' })
export class HospitalSchool {
  @Prop({ type: String, required: true, enum: ['Hospital', 'School'] })
  type: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: Object })
  location: {
    type: {};
    coordinates: [number];
    city: string;
  };

  @Prop({ type: Array })
  courses_or_diseases: [];

  @Prop({ type: String })
  finance_contact_name: string;

  @Prop({ type: String })
  finance_contact_number: string;

  @Prop({ type: String })
  finance_contact_email: string;

  @Prop({ type: String })
  finance_contact_country_code: string;

  @Prop({ type: String })
  escalation_contact_name: string;

  @Prop({ type: String })
  escalation_contact_number: string;

  @Prop({ type: String })
  escalation_contact_country_code: string;

  @Prop({ type: String })
  escalation_contact_email: string;

  @Prop({ type: String })
  state: string;

  @Prop({ type: String })
  website: string;

  @Prop({ type: Number })
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

  @Prop({ type: String })
  hospital_area: string;

  @Prop({ type: String })
  types_of_hospital: string;

  @Prop({ type: Array })
  departments: [];

  @Prop({ type: Array })
  areas_served: [];

  @Prop({ type: Number })
  no_of_beds: number;

  @Prop({ type: Boolean })
  emergency_department: boolean;

  @Prop({ type: Boolean })
  is_draft: boolean;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;
}
export const HospitalSchoolSchema =
  SchemaFactory.createForClass(HospitalSchool);
HospitalSchoolSchema.index({
  type: 'text',
  country: 'text',
  location: '2dsphere',
});
