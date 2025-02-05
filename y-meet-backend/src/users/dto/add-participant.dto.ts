import { IsString, IsNumber } from 'class-validator';

export class AddParticipantDto {
  @IsString()
  userId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
