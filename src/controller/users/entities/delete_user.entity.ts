/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, SchemaTypes } from 'mongoose';

export type deletedUserDocument = deletedUser & Document;

@Schema({ timestamps: true, collection: 'deleted_user' })
export class deletedUser {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  user_id: ObjectId;

  @Prop({ type: String })
  first_name: string;

  @Prop({ type: String })
  last_name: string;

  @Prop({ type: String })
  phone_code: string;

  @Prop({ type: String })
  phone: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  image: string;

  @Prop({ type: Boolean })
  is_donor: boolean;

  @Prop({ type: Boolean })
  is_user: boolean;

  @Prop({ type: Boolean })
  is_volunteer: boolean;

  @Prop({ type: String })
  user_type: string;

  @Prop({ type: Object })
  location: {
    type: {};
    coordinates: [number];
    city: string;
  };

  @Prop({ type: Array })
  current_location: [number];

  @Prop({ type: Boolean })
  is_restaurant: boolean;

  @Prop({ type: String })
  restaurant_name: string;

  @Prop({ type: Object })
  restaurant_location: {
    type: {};
    coordinates: [number];
    city: string;
  };

  @Prop({ type: Boolean })
  is_veg: boolean;

  @Prop({ type: String })
  facebook_id: string;

  @Prop({ type: String })
  google_id: string;

  @Prop({ type: String })
  apple_id: string;

  @Prop({ type: Object })
  my_request: object;

  @Prop({ type: Array })
  my_causes: [];

  @Prop({ type: String })
  access_token: string;

  @Prop({ type: String })
  uuid: string;

  @Prop({ type: String })
  platform: string;

  @Prop({ type: Boolean })
  is_ngo: boolean;

  @Prop({ type: String })
  socket_id: string;

  @Prop({ type: String })
  time_zone: string;

  @Prop({ type: Object })
  ngo_data: {
    _id: ObjectId;
    ngo_causes: [];
    ngo_status: string;
    ngo_name: string;
    ngo_location: object;
  };

  @Prop({ type: Object })
  country_data: {
    country: string;
    currency: [];
    emoji: string;
    country_code: string;
  };
}
export const deletedUserSchema = SchemaFactory.createForClass(deletedUser);
deletedUserSchema.index({
  location: '2dsphere',
  restaurant_location: '2dsphere',
});
deletedUserSchema.index({ user_id: 'text', phone: 'text', email: 'text' });
