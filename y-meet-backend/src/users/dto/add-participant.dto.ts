import { IsMongoId } from 'class-validator';

export class AddParticipantDto {
  @IsMongoId()
  userId: string;
}
