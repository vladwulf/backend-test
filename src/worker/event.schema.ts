import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EventType } from './enum';

export type EventDocument = Event & Document;

@Schema()
export class Event {
  @Prop({ required: true, index: true })
  blockNumber: number;

  @Prop({
    enum: EventType,
    required: true,
  })
  type: EventType;

  @Prop({ required: true })
  chainId: number;

  @Prop({ required: true })
  address: string;

  @Prop()
  username: string;

  @Prop()
  name: string;

  @Prop()
  twitter: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
