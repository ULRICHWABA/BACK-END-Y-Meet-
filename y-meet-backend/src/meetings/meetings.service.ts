    import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
    import { InjectModel } from '@nestjs/mongoose';
    import { Model, Types } from 'mongoose';
    import { Meeting, MeetingDocument } from './meetings.schema';
    import { CreateMeetingDto } from '../users/dto/create-meeting.dto';
    import { AddParticipantDto } from '../users/dto/add-participant.dto';
    import { User, UserDocument } from '../users/users.schema';

    @Injectable()
    export class MeetingsService {
    constructor(
        @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) {}

    // Créer une réunion
    async create(createMeetingDto: CreateMeetingDto): Promise<Meeting> {
        const meeting = new this.meetingModel({
        ...createMeetingDto,
        date: new Date(createMeetingDto.date), // Conversion de la date
        });
        return meeting.save();
    }

    // Récupérer toutes les réunions
    async findAll(): Promise<Meeting[]> {
        return this.meetingModel.find().exec();
    }

    // Récupérer une réunion par ID
    async findOne(id: string): Promise<Meeting> {
        const meeting = await this.meetingModel.findById(id);
        if (!meeting) {
        throw new NotFoundException('Réunion non trouvée');
        }
        return meeting;
    }

    // Supprimer une réunion
    async delete(id: string): Promise<{ message: string }> {
        const result = await this.meetingModel.findByIdAndDelete(id);
        if (!result) throw new NotFoundException('Réunion non trouvée');
        return { message: 'Réunion supprimée avec succès' };
    }

    // Ajouter un participant
    async addParticipant(meetingId: string, addParticipantDto: AddParticipantDto): Promise<Meeting> {
        const meeting = await this.meetingModel.findById(meetingId);
        if (!meeting) throw new NotFoundException('Réunion non trouvée');

        const user: UserDocument | null = await this.userModel.findById(addParticipantDto.userId);
        if (!user) throw new NotFoundException('Utilisateur non trouvé');

        // Vérifier si l'utilisateur est déjà dans la liste
        if ((meeting.participants as Types.ObjectId[]).some(id => id.equals(user._id as Types.ObjectId))) {
            throw new BadRequestException('Utilisateur déjà ajouté');
        }

        // Ajouter l'utilisateur à la liste des participants
        meeting.participants.push(user._id as Types.ObjectId);

        return meeting.save();
    }
    // Supprimer un participant
    async removeParticipant(meetingId: string, userId: string): Promise<Meeting> {
        const meeting = await this.meetingModel.findById(meetingId);
        if (!meeting) throw new NotFoundException('Réunion non trouvée');

        meeting.participants = (meeting.participants as Types.ObjectId[]).filter(id => id.toString() !== userId);
        return meeting.save();
    }
    }
