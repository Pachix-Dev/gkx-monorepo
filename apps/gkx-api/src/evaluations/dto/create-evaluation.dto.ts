import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEvaluationItemDto {
  @ApiProperty({ example: 'handling' })
  @IsString()
  @MaxLength(80)
  criterionCode!: string;

  @ApiProperty({ example: 'Handling' })
  @IsString()
  @MaxLength(160)
  criterionLabel!: string;

  @ApiProperty({ minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  @Max(10)
  score!: number;

  @ApiPropertyOptional({ example: 'Buen control en centros' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateEvaluationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  trainingSessionId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  goalkeeperId!: string;

  @ApiProperty({ example: '2026-03-12' })
  @IsDateString()
  evaluationDate!: string;

  @ApiPropertyOptional({
    example: 'Buen rendimiento general en toma de decisiones',
  })
  @IsOptional()
  @IsString()
  generalComment?: string;

  @ApiProperty({ type: [CreateEvaluationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationItemDto)
  items!: CreateEvaluationItemDto[];
}
