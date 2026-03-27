import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import {
  ApiCommonErrorResponses,
  ApiSuccessResponse,
} from '../common/swagger/openapi.decorators';
import { PlanLimitsService } from './plan-limits.service';

@ApiTags('Plan Limits')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plan-limits')
export class PlanLimitsController {
  constructor(private readonly planLimitsService: PlanLimitsService) {}

  @Get('usage')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Get current plan usage for the authenticated tenant',
  })
  @ApiSuccessResponse({ message: 'Plan usage retrieved' })
  @ApiCommonErrorResponses()
  async getUsage(@CurrentUser() actor: AuthenticatedUser) {
    const data = await this.planLimitsService.getUsage(actor);
    return { success: true, message: 'Plan usage retrieved', data };
  }
}
