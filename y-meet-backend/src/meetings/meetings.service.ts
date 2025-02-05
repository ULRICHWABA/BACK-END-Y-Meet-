import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meeting, MeetingDocument, MeetingStatus } from './meetings.schema';
import { CreateMeetingDto } from '../users/dto/create-meeting.dto';
import { AddParticipantDto } from '../users/dto/add-participant.dto';
import { User, UserDocument } from '../users/users.schema';
import { createObjectCsvWriter } from 'csv-writer';

@Injectable()
export class MeetingsService {
  private readonly SALON_LAT = 5.138495780683241;
  private readonly SALON_LNG = 10.53006132702391;

  constructor(
    @InjectModel(Meeting.name) private readonly meetingModel: Model<MeetingDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createMeetingDto: CreateMeetingDto): Promise<MeetingDocument> {
    const meeting = new this.meetingModel({
      ...createMeetingDto,
      date: new Date(createMeetingDto.date),
    });
    return await meeting.save();
  }

  async findAll(query: any): Promise<{ meetings: MeetingDocument[]; total: number }> {
    const { page = 1, limit = 10, title, date } = query;
    const filter: any = {};

    if (title) filter.title = { $regex: title, $options: 'i' };
    if (date) filter.date = new Date(date);

    const meetings = await this.meetingModel
      .find(filter)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .exec();

    const total = await this.meetingModel.countDocuments(filter);
    return { meetings, total };
  }
  async findOne(id: string): Promise<MeetingDocument>{
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de réunion invalide');
    }

    const meeting = await this.meetingModel.findById(id).populate('participants.userId').lean().exec();
    if (!meeting) {
      throw new NotFoundException('Réunion non trouvée');
    }
    return meeting;
  }

  async delete(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de réunion invalide');
    }

    const result = await this.meetingModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Réunion non trouvée');
    return { message: 'Réunion supprimée avec succès' };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLng = (lng2 - lng1) * rad;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  async addParticipant(meetingId: string, addParticipantDto: AddParticipantDto): Promise<MeetingDocument> {
    const { userId, latitude, longitude } = addParticipantDto;

    if (!Types.ObjectId.isValid(meetingId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID invalide');
    }

    const [meeting, user] = await Promise.all([
      this.meetingModel.findById(meetingId),
      this.userModel.findById(userId),
    ]);

    if (!meeting) throw new NotFoundException('Réunion non trouvée');
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new BadRequestException('Coordonnées invalides');
    }

    const distance = this.calculateDistance(latitude, longitude, this.SALON_LAT, this.SALON_LNG);
    if (distance > 10) {
      throw new BadRequestException(`Vous êtes trop loin du salon (${Math.round(distance)} m)`);
    }

    if (meeting.participants.some(p => p.userId.equals(user.id))) {
      throw new BadRequestException('Utilisateur déjà ajouté');
    }

    meeting.participants.push({ userId: user.id, status: MeetingStatus.PENDING });
    return await meeting.save();
  }

  async generateCSV(meetingId: string): Promise<string> {
    if (!Types.ObjectId.isValid(meetingId)) {
      throw new BadRequestException('ID de réunion invalide');
    }
  
    const meeting = await this.meetingModel.findById(meetingId).populate('participants.userId').exec();
    if (!meeting) {
      throw new NotFoundException('Réunion non trouvée');
    }
  
    const filePath = `./reports/meeting_${meeting._id}_${Date.now()}.csv`;
    const csv = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'name', title: 'Nom' },
        { id: 'status', title: 'Statut' },
        { id: 'arrivalTime', title: 'Heure d\'arrivée' },
        { id: 'departureTime', title: 'Heure de départ' },
      ],
    });
  
    const records = await Promise.all(meeting.participants.map(async participant => {
      const user = await this.userModel.findById(participant.userId).lean().exec();
      return {
        name: user?.name || 'Nom inconnu',
        status: participant.status,
        arrivalTime: participant.arrivalTime || 'N/A',
        departureTime: participant.departureTime || 'N/A',
      };
    }));
  
    try {
      await csv.writeRecords(records);
      return filePath;
    } catch (error) {
      throw new BadRequestException('Erreur lors de la génération du fichier CSV');
    }
  }
}