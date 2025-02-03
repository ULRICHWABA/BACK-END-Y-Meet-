import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from '../users/dto/create-meeting.dto';
import { AddParticipantDto } from '../users/dto/add-participant.dto';
import { Meeting } from './meetings.schema';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {
    
  }

  // Route pour créer une réunion
  @Post()
  async create(@Body() createMeetingDto: CreateMeetingDto): Promise<Meeting> {
    return this.meetingsService.create(createMeetingDto);
  }

  // Route pour récupérer toutes les réunions
  @Get()
  async findAll(): Promise<Meeting[]> {
    return this.meetingsService.findAll();
  }

  // Route pour récupérer une réunion par ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Meeting> {
    return this.meetingsService.findOne(id);
  }

  // Route pour supprimer une réunion
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.meetingsService.delete(id);
  }

  // Route pour ajouter un participant à une réunion
  @Post(':meetingId/participants')
  async addParticipant(@Param('meetingId') meetingId: string, @Body() addParticipantDto: AddParticipantDto): Promise<Meeting> {
    return this.meetingsService.addParticipant(meetingId, addParticipantDto);
  }

  // Route pour supprimer un participant d'une réunion
  @Delete(':meetingId/participants/:userId')
  async removeParticipant(@Param('meetingId') meetingId: string, @Param('userId') userId: string): Promise<Meeting> {
    return this.meetingsService.removeParticipant(meetingId, userId);
  }
}