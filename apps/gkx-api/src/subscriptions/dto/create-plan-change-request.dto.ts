import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import {
  PlanPaymentMethod,
} from '../plan-change-request.entity';
import { TenantPlan } from '../../tenants/tenant.entity';

export class CreatePlanChangeRequestDto {
  @ApiProperty({ enum: TenantPlan })
  @IsEnum(TenantPlan)
  plan!: TenantPlan;

  @ApiProperty({ enum: PlanPaymentMethod })
  @IsEnum(PlanPaymentMethod)
  paymentMethod!: PlanPaymentMethod;

  @ApiPropertyOptional({ description: 'Tenant UUID (SUPER_ADMIN only)' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
