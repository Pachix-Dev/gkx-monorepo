import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsDateString,
  IsEnum,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TrainingSessionStatus } from '../training-session.entity';

export class CreateTrainingSessionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: 'Sesion porteros sub17 - velocidad y blocaje' })
  @IsString()
  @MaxLength(180)
  title!: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Contenidos de entrenamiento permitidos para esta sesion',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  trainingContentIds!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-03-12' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '2026-03-12T17:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2026-03-12T18:30:00.000Z' })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: TrainingSessionStatus })
  @IsOptional()
  @IsEnum(TrainingSessionStatus)
  status?: TrainingSessionStatus;
}
