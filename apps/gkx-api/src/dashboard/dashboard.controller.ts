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
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get aggregated KPIs for the dashboard' })
  @ApiSuccessResponse({ message: 'KPIs retrieved' })
  @ApiCommonErrorResponses()
  async getKpis(@CurrentUser() actor: AuthenticatedUser) {
    const data = await this.dashboardService.getKpis(actor);
    return { success: true, message: 'KPIs retrieved', data };
  }

  @Get('trends')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get trend data for the last 8 weeks' })
  @ApiSuccessResponse({ message: 'Trends retrieved' })
  @ApiCommonErrorResponses()
  async getTrends(@CurrentUser() actor: AuthenticatedUser) {
    const data = await this.dashboardService.getTrends(actor);
    return { success: true, message: 'Trends retrieved', data };
  }

  @Get('alerts')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get automatic plan-limit alerts' })
  @ApiSuccessResponse({ message: 'Alerts retrieved', isArray: true })
  @ApiCommonErrorResponses()
  async getAlerts(@CurrentUser() actor: AuthenticatedUser) {
    const data = await this.dashboardService.getAlerts(actor);
    return { success: true, message: 'Alerts retrieved', data };
  }
}
