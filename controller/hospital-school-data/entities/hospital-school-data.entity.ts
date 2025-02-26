import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type HospitalSchoolDataDocument = HospitalSchoolData & Document;
@Schema({ timestamps: true, collection: 'hospital-school-data' })
export class HospitalSchoolData {
  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  request_id: string;

  @Prop({ type: String, required: true })
  saayam_supported_name: string;

  @Prop({ type: String })
  reference_phone_number: string;

  @Prop({ type: String })
  reference_phone_code: string;

  @Prop({ type: String })
  reference_phone_short_name: string;

  @Prop({ type: String })
  specify_name: string;

  @Prop({ type: Boolean })
  is_draft: boolean;

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

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String })
  updatedBy: string;
}
export const HospitalSchoolDataSchema =
  SchemaFactory.createForClass(HospitalSchoolData);
HospitalSchoolDataSchema.index({
  saayam_supported_name: 'text',
  location: '2dsphere',
});
