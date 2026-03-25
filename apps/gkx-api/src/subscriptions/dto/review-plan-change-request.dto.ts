import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum PlanChangeReviewDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewPlanChangeRequestDto {
  @ApiProperty({ enum: PlanChangeReviewDecision })
  @IsEnum(PlanChangeReviewDecision)
  decision!: PlanChangeReviewDecision;

  @ApiPropertyOptional({ description: 'Optional review note' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
