/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document} from 'mongoose';

export type WomenEmpowermentAreaDocument = WomenEmpowermentArea & Document;

@Schema({ timestamps: true, collection: 'women_empowerment_area' })
export class WomenEmpowermentArea {
    @Prop({ type: String, required: true, unique: true })
    area :string;

    @Prop({ type: Array, default: [] })
    sub_area: [];

    @Prop({ type: String })
    status :string;

    @Prop({ type: String })
    createdBy :string;

    @Prop({ type: String })
    updatedBy :string;

    @Prop({ type: Boolean, default: false })
    is_deleted:boolean;

    @Prop({ type: Date })
    deletedAt:Date;
}

export const WomenEmpowermentAreaSchema = SchemaFactory.createForClass(WomenEmpowermentArea);
