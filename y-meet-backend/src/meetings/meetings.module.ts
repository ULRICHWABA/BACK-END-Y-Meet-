import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { Meeting, MeetingSchema } from './meetings.schema';
import { UsersModule } from '../users/users.module'; // Importez le module utilisateur

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Meeting.name, schema: MeetingSchema }]),
    UsersModule, 
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  
})
export class MeetingsModule {

}