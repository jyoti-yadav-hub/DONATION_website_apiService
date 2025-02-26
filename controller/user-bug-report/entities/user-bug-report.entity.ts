/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,ObjectId, SchemaTypes } from 'mongoose';

export type UserBugReportDocument = UserBugReport & Document;

@Schema({ timestamps: true, collection: 'user-bug-report' })
export class UserBugReport {
    @Prop({ type: String, required: true })
    screen_name: number;

    @Prop({ type: String, required: true })
    image: string;

    @Prop({ type: String, required: true })
    description: string;

    @Prop({ type: String })
    status: string;

    @Prop({ type: String })
    user_name: string;

    @Prop({ type: String})
    user_id: string;
}

export const UserBugReportSchema = SchemaFactory.createForClass(UserBugReport);
