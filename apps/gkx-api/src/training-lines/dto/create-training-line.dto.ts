import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { TrainingLineStatus } from '../training-line.entity';

export class CreateTrainingLineDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: 'Calentamiento' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Bloque inicial de activacion y preparacion' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#22c55e' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: 'flame' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ enum: TrainingLineStatus, example: TrainingLineStatus.ACTIVE })
  @IsOptional()
  @IsEnum(TrainingLineStatus)
  status?: TrainingLineStatus;
}
