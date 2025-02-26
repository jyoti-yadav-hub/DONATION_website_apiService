/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type RegionDocument = Region & Document;
@Schema({ timestamps: true })
export class Region {
    @Prop({ type: String, required: true })
    region: string;

    @Prop({ type: String, required: true, enum: ['Active', 'Deactive'] })
    status: string;  

    @Prop({ type: String, required: true })
    createdBy: string;

    @Prop({ type: String, required: true })
    updatedBy: string;
}
export const RegionSchema = SchemaFactory.createForClass(Region);
