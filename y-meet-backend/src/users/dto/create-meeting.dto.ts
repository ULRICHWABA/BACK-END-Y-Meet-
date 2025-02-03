    import { IsString, IsISO8601, IsNotEmpty } from 'class-validator';

    export class CreateMeetingDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsISO8601()
    @IsNotEmpty()
    date: string; // 👈 Accepte les dates sous format ISO 8601 (ex: "2025-02-01T10:00:00.000Z")

    @IsString()
    @IsNotEmpty()
    location: string;
    }
