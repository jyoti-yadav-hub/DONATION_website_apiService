import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type EmotionalMessageDocument = EmotionalMessage & Document;
@Schema({ timestamps: true, collection: 'emotional-messages' })
export class EmotionalMessage {
  @Prop({ type: String, required: true })
  category_slug: string;

  @Prop({ type: String, required: true, enum: ['image', 'text'] })
  type: string;

  @Prop({ type: String })
  image: string;

  @Prop({ type: String })
  message: string;

  @Prop({ type: String, required: true, enum: ['Active', 'Deactive'] })
  status: string;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ type: String, required: true })
  updatedBy: string;
}
export const EmotionalMessageSchema =
  SchemaFactory.createForClass(EmotionalMessage);
EmotionalMessageSchema.index({
  category_slug: 'text',
  type: 'text',
  status: 'text',
});
