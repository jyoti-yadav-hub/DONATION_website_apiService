/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
export type DeleteAccountDocument = DeleteAccount & Document;
@Schema({ timestamps: true , collection:"delete-account"})
export class DeleteAccount {
    @Prop({ type: String, required: true })
    form_data: string;

    @Prop({ type: String, required: true })
    createdBy: string;

    @Prop({ type: String, required: true })
    updatedBy: string;
}
export const DeleteAccountSchema = SchemaFactory.createForClass(DeleteAccount);
