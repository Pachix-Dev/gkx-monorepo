import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Post,
  UseGuards,
} from '@nestjs/common';
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
  ApiUuidParam,
} from '../common/swagger/openapi.decorators';
import { ChangePlanDto } from './dto/change-plan.dto';
import { CreatePlanChangeRequestDto } from './dto/create-plan-change-request.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  PlanChangeReviewDecision,
  ReviewPlanChangeRequestDto,
} from './dto/review-plan-change-request.dto';
import { PlanChangeRequestStatus } from './plan-change-request.entity';
import type { SubscriptionEntity } from './subscription.entity';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create a subscription for a tenant (SUPER_ADMIN only)',
  })
  @ApiSuccessResponse({ message: 'Subscription created', status: 201 })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.create(dto, actor);
    return { success: true, message: 'Subscription created', data };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all subscriptions (SUPER_ADMIN only)' })
  @ApiSuccessResponse({ message: 'Subscriptions retrieved', isArray: true })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() actor: AuthenticatedUser) {
    const data = await this.subscriptionsService.findAll(actor);
    return { success: true, message: 'Subscriptions retrieved', data };
  }

  @Get('tenant/:tenantId')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get subscriptions for a specific tenant' })
  @ApiUuidParam('tenantId', 'Tenant UUID')
  @ApiSuccessResponse({ message: 'Subscriptions retrieved', isArray: true })
  @ApiCommonErrorResponses()
  async findByTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.findByTenant(tenantId, actor);
    return { success: true, message: 'Subscriptions retrieved', data };
  }

  @Get('tenant/:tenantId/active')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Get the active subscription for a tenant' })
  @ApiUuidParam('tenantId', 'Tenant UUID')
  @ApiSuccessResponse({ message: 'Active subscription retrieved' })
  @ApiCommonErrorResponses()
  async findActive(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.findActive(tenantId, actor);
    return { success: true, message: 'Active subscription retrieved', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a subscription (SUPER_ADMIN only)' })
  @ApiUuidParam('id', 'Subscription UUID')
  @ApiSuccessResponse({ message: 'Subscription updated' })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubscriptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.update(id, dto, actor);
    return { success: true, message: 'Subscription updated', data };
  }

  @Get('plans')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({
    summary: 'List available subscription plans and payment methods',
  })
  @ApiSuccessResponse({ message: 'Plan offers retrieved', isArray: true })
  @ApiCommonErrorResponses()
  getPlanOffers() {
    const data = this.subscriptionsService.getPlanOffers();
    return { success: true, message: 'Plan offers retrieved', data };
  }

  @Post('change-requests')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Create a paid plan change request (card or SPEI)' })
  @ApiSuccessResponse({ message: 'Plan change request created', status: 201 })
  @ApiCommonErrorResponses()
  async createPlanChangeRequest(
    @Body() dto: CreatePlanChangeRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.createPlanChangeRequest(
      dto,
      actor,
    );
    return { success: true, message: 'Plan change request created', data };
  }

  @Get('change-requests/my')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'List plan change requests for current tenant' })
  @ApiSuccessResponse({
    message: 'Plan change requests retrieved',
    isArray: true,
  })
  @ApiCommonErrorResponses()
  async getMyPlanChangeRequests(@CurrentUser() actor: AuthenticatedUser) {
    const data =
      await this.subscriptionsService.findMyPlanChangeRequests(actor);
    return { success: true, message: 'Plan change requests retrieved', data };
  }

  @Get('change-requests')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List plan change requests (SUPER_ADMIN only)' })
  @ApiSuccessResponse({
    message: 'Plan change requests retrieved',
    isArray: true,
  })
  @ApiCommonErrorResponses()
  async findPlanChangeRequests(
    @CurrentUser() actor: AuthenticatedUser,
    @Query('status') status?: PlanChangeRequestStatus,
  ) {
    const data = await this.subscriptionsService.findPlanChangeRequests(
      actor,
      status,
    );
    return { success: true, message: 'Plan change requests retrieved', data };
  }

  @Patch('change-requests/:id/review')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Approve/reject SPEI plan change request (SUPER_ADMIN only)',
  })
  @ApiUuidParam('id', 'Plan change request UUID')
  @ApiSuccessResponse({ message: 'Plan change request reviewed' })
  @ApiCommonErrorResponses()
  async reviewPlanChangeRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewPlanChangeRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.reviewPlanChangeRequest(
      id,
      dto.decision === PlanChangeReviewDecision.APPROVE,
      actor,
      dto.notes,
    );
    return { success: true, message: 'Plan change request reviewed', data };
  }

  @Patch('tenant/:tenantId/change-plan')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Change plan directly (SUPER_ADMIN manual override only)',
  })
  @ApiUuidParam('tenantId', 'Tenant UUID')
  @ApiSuccessResponse({ message: 'Plan changed successfully' })
  @ApiCommonErrorResponses()
  async changePlan(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: ChangePlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data: SubscriptionEntity = await this.subscriptionsService.changePlan(
      tenantId,
      dto.plan,
      actor,
    );
    return { success: true, message: 'Plan changed successfully', data };
  }

  @Post('tenant/:tenantId/customer-portal-session')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Create a Stripe customer portal session' })
  @ApiUuidParam('tenantId', 'Tenant UUID')
  @ApiSuccessResponse({ message: 'Customer portal session created' })
  @ApiCommonErrorResponses()
  async createCustomerPortalSession(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.createCustomerPortalSession(
      tenantId,
      actor,
    );
    return { success: true, message: 'Customer portal session created', data };
  }

  @Post('tenant/:tenantId/cancel-auto-renew')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Cancel auto-renew at current period end' })
  @ApiUuidParam('tenantId', 'Tenant UUID')
  @ApiSuccessResponse({ message: 'Auto-renew canceled' })
  @ApiCommonErrorResponses()
  async cancelAutoRenew(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.cancelAutoRenew(
      tenantId,
      actor,
    );
    return { success: true, message: 'Auto-renew canceled', data };
  }

  @Post('tenant/:tenantId/reactivate-auto-renew')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Reactivate auto-renew for the current subscription',
  })
  @ApiUuidParam('tenantId', 'Tenant UUID')
  @ApiSuccessResponse({ message: 'Auto-renew reactivated' })
  @ApiCommonErrorResponses()
  async reactivateAutoRenew(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.reactivateAutoRenew(
      tenantId,
      actor,
    );
    return { success: true, message: 'Auto-renew reactivated', data };
  }

  @Post('tenant/:tenantId/schedule-downgrade')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({
    summary: 'Schedule a Stripe plan downgrade at current period end',
  })
  @ApiUuidParam('tenantId', 'Tenant UUID')
  @ApiSuccessResponse({ message: 'Downgrade scheduled' })
  @ApiCommonErrorResponses()
  async scheduleStripeDowngrade(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: ChangePlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.scheduleStripeDowngrade(
      tenantId,
      dto.plan,
      actor,
    );
    return { success: true, message: 'Downgrade scheduled', data };
  }

  @Post('tenant/:tenantId/cancel-spei-at-period-end')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Cancel a SPEI subscription at current period end (SUPER_ADMIN only)',
  })
  @ApiUuidParam('tenantId', 'Tenant UUID')
  @ApiSuccessResponse({
    message: 'SPEI subscription marked to cancel at period end',
  })
  @ApiCommonErrorResponses()
  async cancelSpeiAtPeriodEnd(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const data = await this.subscriptionsService.cancelSpeiAtPeriodEnd(
      tenantId,
      actor,
    );
    return {
      success: true,
      message: 'SPEI subscription marked to cancel at period end',
      data,
    };
  }
}
