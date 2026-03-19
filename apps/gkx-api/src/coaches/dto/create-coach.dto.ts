import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateCoachDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ example: 'Entrenamiento de reflejos' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  specialty?: string;

  @ApiPropertyOptional({ example: 'UEFA B' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseLevel?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;
}
