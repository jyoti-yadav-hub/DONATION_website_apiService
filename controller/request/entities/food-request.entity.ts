/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
    Document,
    ObjectId,
    Schema as MongooseSchema,
    SchemaTypes,
} from 'mongoose';

export type FoodRequestDocument = FoodRequestModel & Document;

@Schema({ collection: 'requests' })
export class FoodRequestModel {
    @Prop({ type: String })
    reference_id: string 
    
    @Prop({ type: String, required: true })
    category_slug: string;

    @Prop({ type: String, required: true })
    category_name: string;

    @Prop({ type: String, required: true })
    active_type: string;

    @Prop({ type: SchemaTypes.ObjectId, required: true })
    user_id: ObjectId;

    @Prop({ type: String })
    uname: string;

    @Prop({ type: String })
    user_image: string;

    @Prop({ type: String })
    form_settings: string

    @Prop({ type: Object, required: true })
    location: {
        // eslint-disable-next-line @typescript-eslint/ban-types
        type: {};
        coordinates: [number];
        city: string;
    };

    @Prop({ type: Object })
    form_data: object

    @Prop({ type: SchemaTypes.ObjectId })
    user_ngo_id: ObjectId;

    @Prop({ type: SchemaTypes.ObjectId })
    donor_ngo_id: ObjectId;

    @Prop({ type: SchemaTypes.ObjectId })
    volunteer_ngo_id: ObjectId;

    @Prop({ type: String })
    status: string;

    @Prop({ type: Number, default: 0 })
    prepare_time: number;

    @Prop({ type: Boolean })
    is_deleted: boolean;

    @Prop({ type: Object, default: null })
    donor_accept: {
        user_name: string;
        phone: string;
        image: string;
        address: string;
        lat: number;
        lng: number;
        accept_time: Date;
        restaurant_name: string;
        country_code: string;
    };

    @Prop({ type: Object, default: null })
    volunteer_accept: {
        user_name: string;
        phone: string;
        image: string;
        address: string;
        lat: number;
        lng: number;
        accept_time: Date;
        country_code: string;
    };

    @Prop({ type: Boolean, default: false })
    deliver_by_self: boolean;

    @Prop({ type: Date, default: null })
    picked_up_time: Date;

    @Prop({ type: Date, default: null })
    deliver_time: Date;

    @Prop({ type: Date })
    cancelled_at: Date;

    @Prop({ type: Date })
    delete_time: Date;

    @Prop({ type: String })
    cancelled_by: string;

    @Prop({ type: String })
    cancellation_reason: string;

    @Prop({ type: Array, default: [] })
    volunteer_id: any;

    @Prop({ type: Array, default: [] })
    ngo_volunteer_ids: any;

    @Prop({ type: Array, default: [] })
    donor_id: any;

    @Prop({ type: Array, default: [] })
    ngo_donor_ids: any;

    @Prop({ type: Array, default: [] })
    ngo_ids: any;

    @Prop({ type: Array, default: null })
    accept_donor_ids: [];

    @Prop({ type: Array, default: [] })
    accept_volunteer_ids: [];

    @Prop({ type: Object })
    userDtl: object;

    @Prop({ type: String })
    image_url: string;

    @Prop({ type: String })
    current_type: string;

    @Prop({ type: Boolean })
    noVolunteer: boolean;

    @Prop({ type: Object })
    country_data: {
        country: string,
        country_code: string,
        currency: string;
        currency_code: string;
    };

    @Prop({ type: String })
    distance: string;

    @Prop({ type: String })
    duration: string;

    @Prop({ type: Date })
    createdAt: Date;

    @Prop({ type: Date })
    updatedAt: Date;
}

export const FoodRequestSchema = SchemaFactory.createForClass(FoodRequestModel);
FoodRequestSchema.index({ location: '2dsphere', volunteer_loc: '2dsphere' });
FoodRequestSchema.index({ category_slug:'text', active_type:'text', user_id:'text' });
