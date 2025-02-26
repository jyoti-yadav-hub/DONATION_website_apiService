/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type EmailTemplateDocument = EmailTemplate & Document;
@Schema({ timestamps: true, collection: 'email-templates' })
export class EmailTemplate {
    @Prop({ type: String, required: true })
    email_template_name: string;

    @Prop({ type: String, required: true })
    email_content: string;
    
    @Prop({ type: String, length: 255, required: true })
    email_subject: string;
    
    @Prop({ type: String, required: true })
    email_slug: string;
    
    @Prop({ type: String, required: true })
    email_status: string;

    @Prop({ type: String, required: true })
    createdBy: string;

    @Prop({ type: String, required: true })
    updatedBy: string;
}
export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);
EmailTemplateSchema.index({ email_slug: 'text', email_status: 'text' });
