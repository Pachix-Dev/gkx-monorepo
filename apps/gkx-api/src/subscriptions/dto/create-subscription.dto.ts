import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TenantPlan } from '../../tenants/tenant.entity';
import { SubscriptionStatus } from '../subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Tenant UUID' })
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({ enum: TenantPlan })
  @IsEnum(TenantPlan)
  plan!: TenantPlan;

  @ApiPropertyOptional({
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIALING,
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @IsDateString()
  currentPeriodStart!: string;

  @ApiProperty({ example: '2026-12-31T23:59:59.999Z' })
  @IsDateString()
  currentPeriodEnd!: string;

  @ApiPropertyOptional({ example: '2026-01-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;

  @ApiPropertyOptional({
    description: 'External billing reference (e.g. Stripe subscription ID)',
  })
  @IsOptional()
  @IsString()
  externalRef?: string;
}
