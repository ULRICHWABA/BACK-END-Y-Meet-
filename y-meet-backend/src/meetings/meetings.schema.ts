import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum MeetingStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LATE = 'Late',
  LEFT_EARLY = 'Left Early',
  PENDING = "PENDING",
}
export interface User {
  _id: Types.ObjectId; // Assurez-vous d'inclure _id
  name: string; // Assurez-vous que name existe
  // autres propriétés...
}
export type MeetingDocument = Meeting & Document;

@Schema({ _id: false }) // Utilisé pour indiquer que ce schéma n'a pas besoin d'un ID propre
class Participant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date })
  arrivalTime?: Date;

  @Prop({ type: Date })
  departureTime?: Date;

  @Prop({
    type: String,
    enum: Object.values(MeetingStatus),
    default: MeetingStatus.ABSENT,
  })
  status: MeetingStatus;
}

@Schema({ timestamps: true })
export class Meeting {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop({
    type: Object,
    required: true,
    default: () => ({
      latitude: 5.138495780683241,
      longitude: 10.53006132702391,
    }),
  })
  location: { latitude: number; longitude: number };

  @Prop({ type: [Participant], default: [] })
  participants: Participant[];
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);