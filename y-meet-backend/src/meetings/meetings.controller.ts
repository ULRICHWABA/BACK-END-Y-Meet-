import { 
  Controller, Get, Post, Param, Body, Delete, Query, BadRequestException, 
  NotFoundException, Res 
} from '@nestjs/common';
import { Response } from 'express';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from '../users/dto/create-meeting.dto';
import { AddParticipantDto } from '../users/dto/add-participant.dto';
import { Meeting } from './meetings.schema';
import { Types } from 'mongoose';
import * as fs from 'fs';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  async create(@Body() createMeetingDto: CreateMeetingDto): Promise<Meeting> {
    return this.meetingsService.create(createMeetingDto);
  }

  @Get()
  async findAll(@Query() query: Record<string, any>): Promise<{ meetings: Meeting[]; total: number }> {
    return this.meetingsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Meeting> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de réunion invalide');
    }
    const meeting = await this.meetingsService.findOne(id);
    if (!meeting) {
      throw new NotFoundException('Réunion non trouvée');
    }
    return meeting;
  }

  @Post(':id/participants')
  async addParticipant(
    @Param('id') meetingId: string,
    @Body() addParticipantDto: AddParticipantDto,
  ): Promise<Meeting> {
    if (!Types.ObjectId.isValid(meetingId)) {
      throw new BadRequestException('ID de réunion invalide');
    }
    return this.meetingsService.addParticipant(meetingId, addParticipantDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de réunion invalide');
    }
    return this.meetingsService.delete(id);
  }

  @Get(':id/csv')
  async generateCSV(@Param('id') meetingId: string, @Res({ passthrough: true }) res: Response) {
    console.log('ID de réunion reçu:', meetingId);

    if (!meetingId || !Types.ObjectId.isValid(meetingId)) {
      throw new BadRequestException('ID de réunion invalide');
    }

    const filePath = await this.meetingsService.generateCSV(meetingId);
    console.log('Chemin du fichier CSV:', filePath);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Fichier CSV non trouvé');
    }

    res.download(filePath, `rapport_reunion_${meetingId}.csv`);
  }
}
