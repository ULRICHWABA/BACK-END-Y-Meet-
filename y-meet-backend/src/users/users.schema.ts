import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true }) // Ajout de la propriété 'name'
    name: string;

    @Prop({ unique: true, sparse: true })
    username?: string;

    @Prop({ default: 'user' })
    role: string;

    @Prop({ default: false })
    isVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);