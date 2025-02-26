import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Document,
  Schema as MongooseSchema,
  ObjectId,
  SchemaTypes,
} from 'mongoose';

export type QueueDocument = Queue & Document;

@Schema({ timestamps: true })
export class Queue {
  @Prop({ type: SchemaTypes.ObjectId, required: true })
  request_id: ObjectId;

  @Prop({ type: Array })
  users: [];

  @Prop({ type: Array })
  ngoUsers: [];

  @Prop({ type: Array })
  ngos: [];

  @Prop({ type: Number })
  attempt: number;

  @Prop({ type: Number })
  total_attempt: number;

  @Prop({ type: Number })
  radius: number;

  @Prop({ type: Number })
  max_radius_km: number;

  @Prop({ type: Date, default: Date.now })
  cron_time: string;

  @Prop({ type: String })
  type: string;

  @Prop({ type: Number })
  accept_time_out: number;
}

export const QueueSchema = SchemaFactory.createForClass(Queue);
