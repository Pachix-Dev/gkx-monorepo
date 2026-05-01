import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { TenantEntity, TenantPlan } from '../tenants/tenant.entity';
import { CreatePlanChangeRequestDto } from './dto/create-plan-change-request.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  mapStripePriceToPlan,
  getPlanOffers,
  getRecurringPlanPriceId,
} from './plan-offers.config';
import {
  PlanChangeRequestEntity,
  PlanChangeRequestStatus,
  PlanPaymentMethod,
} from './plan-change-request.entity';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionEntity, SubscriptionStatus } from './subscription.entity';

type StripeWebhookEvent = {
  type: string;
  data: { object: unknown };
};

type StripeClient = {
  webhooks: {
    constructEvent: (
      payload: Buffer,
      signature: string,
      secret: string,
    ) => StripeWebhookEvent;
  };
  checkout: {
    sessions: {
      create: (payload: Record<string, unknown>) => Promise<{
        id: string;
        url: string | null;
      }>;
      retrieve: (sessionId: string) => Promise<Record<string, unknown>>;
    };
  };
  subscriptions: {
    retrieve: (subscriptionId: string) => Promise<Record<string, unknown>>;
    update: (
      subscriptionId: string,
      payload: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
  };
  billingPortal: {
    sessions: {
      create: (payload: Record<string, unknown>) => Promise<{ url: string }>;
    };
  };
};

type StripeScheduleClient = {
  subscriptionSchedules: {
    create: (
      payload: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
    retrieve: (id: string) => Promise<Record<string, unknown>>;
    update: (
      id: string,
      payload: Record<string, unknown>,
    ) => Promise<Record<string, unknown>>;
    cancel: (id: string) => Promise<Record<string, unknown>>;
  };
};

type StripeModule = {
  default: new (apiKey: string) => StripeClient;
};

const PLAN_ORDER: Record<TenantPlan, number> = {
  [TenantPlan.FREE]: 0,
  [TenantPlan.BASIC]: 1,
  [TenantPlan.PRO]: 2,
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionsRepository: Repository<SubscriptionEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(PlanChangeRequestEntity)
    private readonly planChangeRequestsRepository: Repository<PlanChangeRequestEntity>,
  ) {}

  getPlanOffers() {
    return getPlanOffers();
  }

  async create(dto: CreateSubscriptionDto, actor: AuthenticatedUser) {
    this.assertSuperAdmin(actor);

    const tenant = await this.tenantsRepository.findOne({
      where: { id: dto.tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const currentPeriodStart = this.parseIsoDateOrThrow(
      dto.currentPeriodStart,
      'currentPeriodStart',
    );
    const currentPeriodEnd = this.parseIsoDateOrThrow(
      dto.currentPeriodEnd,
      'currentPeriodEnd',
    );
    this.assertValidPeriodRange(currentPeriodStart, currentPeriodEnd);

    const subscription = this.subscriptionsRepository.create({
      tenantId: dto.tenantId,
      plan: dto.plan,
      status: dto.status ?? SubscriptionStatus.TRIALING,
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
      canceledAt: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSubscriptionItemId: null,
      stripePriceId: null,
      stripeScheduleId: null,
      externalRef: dto.externalRef ?? null,
    });

    const saved = await this.subscriptionsRepository.save(subscription);

    tenant.plan = dto.plan;
    await this.tenantsRepository.save(tenant);

    return saved;
  }

  async findAll(actor: AuthenticatedUser) {
    this.assertSuperAdmin(actor);
    return this.subscriptionsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findByTenant(tenantId: string, actor: AuthenticatedUser) {
    if (actor.role !== Role.SUPER_ADMIN && actor.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.subscriptionsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(tenantId: string, actor: AuthenticatedUser) {
    if (actor.role !== Role.SUPER_ADMIN && actor.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    const subs = await this.subscriptionsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    return (
      subs.find(
        (s) =>
          s.status === SubscriptionStatus.ACTIVE ||
          s.status === SubscriptionStatus.TRIALING ||
          (s.status === SubscriptionStatus.CANCELED && s.cancelAtPeriodEnd),
      ) ?? null
    );
  }

  async update(
    id: string,
    dto: UpdateSubscriptionDto,
    actor: AuthenticatedUser,
  ) {
    this.assertSuperAdmin(actor);

    const subscription = await this.subscriptionsRepository.findOne({
      where: { id },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    if (dto.status === undefined) {
      throw new BadRequestException('status is required');
    }

    subscription.status = dto.status;

    const saved = await this.subscriptionsRepository.save(subscription);

    return saved;
  }

  async changePlan(
    tenantId: string,
    plan: TenantPlan,
    actor: AuthenticatedUser,
  ): Promise<SubscriptionEntity> {
    if (actor.role === Role.USER) {
      throw new ForbiddenException(
        'USER must create a paid plan change request (CARD/SPEI)',
      );
    }

    this.assertTenantAccess(tenantId, actor);
    return this.applyPlanToTenant(tenantId, plan, 'super-admin-manual');
  }

  async createPlanChangeRequest(
    dto: CreatePlanChangeRequestDto,
    actor: AuthenticatedUser,
  ) {
    const tenantId = this.resolveTargetTenantId(dto.tenantId, actor);

    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (dto.plan === TenantPlan.FREE) {
      throw new BadRequestException('Use FREE only for cancel/downgrade flow');
    }

    const activeSubscription =
      await this.findLatestTenantSubscription(tenantId);
    const currentPlan = activeSubscription?.plan ?? tenant.plan;

    const currentRank = PLAN_ORDER[currentPlan] ?? 0;
    const requestedRank = PLAN_ORDER[dto.plan] ?? 0;
    const isDowngrade = requestedRank < currentRank;

    if (dto.paymentMethod === PlanPaymentMethod.CARD) {
      if (isDowngrade) {
        throw new BadRequestException(
          'Card plan downgrades must use the schedule-downgrade endpoint',
        );
      }
      this.assertUpgradeOnly(currentPlan, dto.plan);
    } else if (requestedRank === currentRank) {
      throw new BadRequestException(
        'Cannot request the same plan you currently have',
      );
    }

    const request = this.planChangeRequestsRepository.create({
      tenantId,
      requestedByUserId: actor.userId,
      requestedPlan: dto.plan,
      paymentMethod: dto.paymentMethod,
      status:
        dto.paymentMethod === PlanPaymentMethod.CARD
          ? PlanChangeRequestStatus.PENDING_PAYMENT
          : PlanChangeRequestStatus.PENDING_REVIEW,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      reviewedByUserId: null,
      reviewedAt: null,
      reviewNotes: null,
    });

    const saved = await this.planChangeRequestsRepository.save(request);

    if (dto.paymentMethod === PlanPaymentMethod.SPEI) {
      return {
        request: saved,
        instructions:
          'Pago por SPEI registrado. SUPER_ADMIN validara el pago y activara el plan manualmente.',
      };
    }

    const cardResult = await this.handleCardPlanChange(
      saved,
      activeSubscription,
    );

    if (cardResult.mode === 'checkout') {
      saved.stripeCheckoutSessionId = cardResult.sessionId;
      await this.planChangeRequestsRepository.save(saved);

      return {
        request: saved,
        checkoutUrl: cardResult.url,
      };
    }

    const refreshed = await this.planChangeRequestsRepository.findOne({
      where: { id: saved.id },
    });

    return {
      request: refreshed ?? saved,
      instructions: 'Plan actualizado con prorrateo inmediato.',
    };
  }

  async createCustomerPortalSession(
    tenantId: string,
    actor: AuthenticatedUser,
  ) {
    this.assertTenantAccess(tenantId, actor);

    const subscription = await this.findLatestTenantSubscription(tenantId);
    if (!subscription?.stripeCustomerId) {
      throw new BadRequestException(
        'No Stripe customer linked to this tenant subscription',
      );
    }

    const stripe = await this.getStripeClient();
    const billingBaseUrl = this.getBillingBaseUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${billingBaseUrl}/billing`,
    });

    return { url: session.url };
  }

  async cancelAutoRenew(tenantId: string, actor: AuthenticatedUser) {
    this.assertTenantAccess(tenantId, actor);

    const subscription = await this.findLatestTenantSubscription(tenantId);
    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException('No recurrent Stripe subscription found');
    }

    const stripe = await this.getStripeClient();

    const subscriptionScheduleId = this.readString(
      subscription.stripeScheduleId,
    );
    if (subscriptionScheduleId) {
      try {
        await (
          stripe as unknown as StripeScheduleClient
        ).subscriptionSchedules.cancel(subscriptionScheduleId);
      } catch {
        /* ignore if already released/canceled */
      }
      subscription.stripeScheduleId = null;
      await this.subscriptionsRepository.save(subscription);
    }

    const updated = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    return this.syncStripeSubscription(updated);
  }

  async reactivateAutoRenew(tenantId: string, actor: AuthenticatedUser) {
    this.assertTenantAccess(tenantId, actor);

    const subscription = await this.findLatestTenantSubscription(tenantId);
    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException('No recurrent Stripe subscription found');
    }

    const stripe = await this.getStripeClient();
    const updated = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      },
    );

    return this.syncStripeSubscription(updated);
  }

  async findMyPlanChangeRequests(actor: AuthenticatedUser) {
    const tenantId = actor.tenantId;
    return this.planChangeRequestsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findPlanChangeRequests(
    actor: AuthenticatedUser,
    status?: PlanChangeRequestStatus,
  ) {
    this.assertSuperAdmin(actor);

    return this.planChangeRequestsRepository.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async reviewPlanChangeRequest(
    id: string,
    approved: boolean,
    actor: AuthenticatedUser,
    notes?: string,
  ) {
    this.assertSuperAdmin(actor);

    const request = await this.planChangeRequestsRepository.findOne({
      where: { id },
    });
    if (!request) throw new NotFoundException('Plan change request not found');

    if (request.paymentMethod !== PlanPaymentMethod.SPEI) {
      throw new BadRequestException(
        'Only SPEI requests can be reviewed manually',
      );
    }

    if (request.status !== PlanChangeRequestStatus.PENDING_REVIEW) {
      throw new BadRequestException('This request is no longer pending review');
    }

    request.reviewedByUserId = actor.userId;
    request.reviewedAt = new Date();
    request.reviewNotes = notes ?? null;

    if (!approved) {
      request.status = PlanChangeRequestStatus.REJECTED;
      return this.planChangeRequestsRepository.save(request);
    }

    // Capture existing Stripe subscription before applying new plan
    const existingSubscription = await this.findLatestTenantSubscription(
      request.tenantId,
    );
    const existingStripeSubId =
      existingSubscription?.stripeSubscriptionId ?? null;
    const existingScheduleId = this.readString(
      existingSubscription?.stripeScheduleId,
    );

    const tenant = await this.tenantsRepository.findOne({
      where: { id: request.tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const currentPlan = existingSubscription?.plan ?? tenant.plan;
    const currentRank = PLAN_ORDER[currentPlan] ?? 0;
    const requestedRank = PLAN_ORDER[request.requestedPlan] ?? 0;
    const isDowngrade = requestedRank < currentRank;

    if (isDowngrade) {
      if (existingStripeSubId) {
        const stripe = await this.getStripeClient();
        if (existingScheduleId) {
          try {
            await (
              stripe as unknown as StripeScheduleClient
            ).subscriptionSchedules.cancel(existingScheduleId);
          } catch {
            /* schedule may already be released/canceled */
          }
        }
        await stripe.subscriptions.update(existingStripeSubId, {
          cancel_at_period_end: true,
        });
      }

      if (existingSubscription) {
        existingSubscription.cancelAtPeriodEnd = true;
        await this.subscriptionsRepository.save(existingSubscription);
      }

      request.status = PlanChangeRequestStatus.COMPLETED;
      request.reviewNotes =
        'SPEI downgrade approved. Current plan remains active until period end; renewal must be manually approved.';
      return this.planChangeRequestsRepository.save(request);
    }

    await this.applyPlanToTenant(
      request.tenantId,
      request.requestedPlan,
      'spei-manual-approval',
    );

    // Cancel the Stripe subscription at period end to prevent double billing
    if (existingStripeSubId) {
      const stripe = await this.getStripeClient();
      if (existingScheduleId) {
        try {
          await (
            stripe as unknown as StripeScheduleClient
          ).subscriptionSchedules.cancel(existingScheduleId);
        } catch {
          /* schedule may already be released/canceled */
        }
      }
      try {
        await stripe.subscriptions.update(existingStripeSubId, {
          cancel_at_period_end: true,
        });
      } catch {
        /* don't fail the SPEI approval if Stripe call errors */
      }
    }

    request.status = PlanChangeRequestStatus.COMPLETED;
    return this.planChangeRequestsRepository.save(request);
  }

  async processStripeWebhook(
    rawBody: Buffer | undefined,
    signature?: string,
  ): Promise<{ applied: boolean; reason?: string; subscriptionId?: string }> {
    const event = await this.verifyStripeEvent(rawBody, signature);
    const payload = event.data.object as Record<string, unknown>;

    if (event.type === 'checkout.session.completed') {
      const applied = await this.handleCheckoutCompleted(payload);
      return {
        applied,
        reason: applied ? undefined : 'No matching plan change request',
      };
    }

    if (!event.type.startsWith('customer.subscription.')) {
      return { applied: false, reason: 'Unhandled event type' };
    }

    const synced = await this.syncStripeSubscription(payload);
    return { applied: true, subscriptionId: synced.id };
  }

  private assertSuperAdmin(actor: AuthenticatedUser) {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can manage subscriptions');
    }
  }

  private assertTenantAccess(tenantId: string, actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) return;

    if (actor.role === Role.USER && actor.tenantId === tenantId) return;

    throw new ForbiddenException('Access denied');
  }

  private async verifyStripeEvent(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ): Promise<StripeWebhookEvent> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new UnauthorizedException('Missing STRIPE_WEBHOOK_SECRET');
    }

    if (!signature) {
      throw new UnauthorizedException('Missing Stripe signature header');
    }

    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Missing raw webhook body');
    }

    const stripe = await this.getStripeClient();

    try {
      return stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new UnauthorizedException('Invalid Stripe webhook signature');
    }
  }

  private async handleCheckoutCompleted(
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    const metadata = payload.metadata as Record<string, unknown> | undefined;
    const requestId = this.readString(metadata?.planChangeRequestId);
    if (!requestId) return false;

    const request = await this.planChangeRequestsRepository.findOne({
      where: { id: requestId },
    });
    if (!request) return false;

    request.stripeCheckoutSessionId =
      this.readString(payload.id) ?? request.stripeCheckoutSessionId;
    request.stripePaymentIntentId =
      this.readString(payload.payment_intent) ?? request.stripePaymentIntentId;

    const stripeSubscriptionId = this.readString(payload.subscription);
    if (!stripeSubscriptionId) {
      await this.planChangeRequestsRepository.save(request);
      return true;
    }

    const stripe = await this.getStripeClient();
    const stripeSubscription =
      await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const synced = await this.syncStripeSubscription(stripeSubscription);

    if (request.status === PlanChangeRequestStatus.PENDING_PAYMENT) {
      request.status = PlanChangeRequestStatus.COMPLETED;
      request.reviewedAt = new Date();
      request.reviewNotes =
        'Auto-completed by Stripe checkout.session.completed';
      await this.planChangeRequestsRepository.save(request);
    }

    return Boolean(synced.id);
  }

  private async handleCardPlanChange(
    request: PlanChangeRequestEntity,
    activeSubscription: SubscriptionEntity | null,
  ): Promise<
    | {
        mode: 'checkout';
        sessionId: string;
        url: string;
      }
    | {
        mode: 'upgrade';
      }
  > {
    const priceId = getRecurringPlanPriceId(request.requestedPlan);
    if (!priceId) {
      throw new BadRequestException(
        `Missing STRIPE_PRICE_ID_${request.requestedPlan} for recurring checkout`,
      );
    }

    if (
      activeSubscription?.stripeSubscriptionId &&
      (activeSubscription.status === SubscriptionStatus.ACTIVE ||
        activeSubscription.status === SubscriptionStatus.TRIALING ||
        (activeSubscription.status === SubscriptionStatus.CANCELED &&
          activeSubscription.cancelAtPeriodEnd))
    ) {
      await this.upgradeExistingStripeSubscription(
        request,
        activeSubscription,
        priceId,
      );
      return { mode: 'upgrade' };
    }

    const checkout = await this.createCardCheckoutSession(request, priceId);

    return {
      mode: 'checkout',
      sessionId: checkout.sessionId,
      url: checkout.url,
    };
  }

  private async upgradeExistingStripeSubscription(
    request: PlanChangeRequestEntity,
    activeSubscription: SubscriptionEntity,
    targetPriceId: string,
  ) {
    const stripe = await this.getStripeClient();

    // Cancel any scheduled downgrade before proceeding with the upgrade
    const activeScheduleId = this.readString(
      activeSubscription.stripeScheduleId,
    );
    if (activeScheduleId) {
      try {
        await (
          stripe as unknown as StripeScheduleClient
        ).subscriptionSchedules.cancel(activeScheduleId);
      } catch {
        /* ignore if already released/canceled */
      }
      activeSubscription.stripeScheduleId = null;
      await this.subscriptionsRepository.save(activeSubscription);
    }

    const subscriptionItemId = activeSubscription.stripeSubscriptionItemId;
    if (!subscriptionItemId) {
      throw new BadRequestException(
        'Existing Stripe subscription item is missing for this tenant',
      );
    }

    const updated = await stripe.subscriptions.update(
      activeSubscription.stripeSubscriptionId as string,
      {
        cancel_at_period_end: false,
        proration_behavior: 'create_prorations',
        items: [{ id: subscriptionItemId, price: targetPriceId }],
        metadata: {
          tenantId: request.tenantId,
          requestedPlan: request.requestedPlan,
          planChangeRequestId: request.id,
        },
      },
    );

    await this.syncStripeSubscription(updated);

    request.status = PlanChangeRequestStatus.COMPLETED;
    request.reviewedAt = new Date();
    request.reviewNotes = 'Auto-completed by Stripe proration upgrade';
    await this.planChangeRequestsRepository.save(request);
  }

  private async createCardCheckoutSession(
    request: PlanChangeRequestEntity,
    priceId: string,
  ) {
    const billingBaseUrl = this.getBillingBaseUrl();

    const stripe = await this.getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      success_url: `${billingBaseUrl}/billing?payment=success`,
      cancel_url: `${billingBaseUrl}/billing?payment=cancelled`,
      metadata: {
        tenantId: request.tenantId,
        requestedPlan: request.requestedPlan,
        planChangeRequestId: request.id,
      },
      subscription_data: {
        metadata: {
          tenantId: request.tenantId,
          requestedPlan: request.requestedPlan,
          planChangeRequestId: request.id,
        },
      },
      line_items: [
        {
          quantity: 1,
          price: priceId,
        },
      ],
    });

    if (!session.url) {
      throw new BadRequestException('Failed to create checkout session URL');
    }

    return { sessionId: session.id, url: session.url };
  }

  private resolveTargetTenantId(
    tenantIdFromDto: string | undefined,
    actor: AuthenticatedUser,
  ) {
    if (actor.role === Role.SUPER_ADMIN) {
      if (!tenantIdFromDto) {
        throw new BadRequestException('tenantId is required for SUPER_ADMIN');
      }
      return tenantIdFromDto;
    }

    if (!actor.tenantId) {
      throw new ForbiddenException('No tenant associated to current USER');
    }

    return actor.tenantId;
  }

  private async applyPlanToTenant(
    tenantId: string,
    plan: TenantPlan,
    externalRef: string,
  ): Promise<SubscriptionEntity> {
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Always create a new record so existing Stripe-linked records are not overwritten
    // and can continue syncing independently via webhooks.
    const target = this.subscriptionsRepository.create({
      tenantId,
      plan,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEndsAt: null,
      canceledAt: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSubscriptionItemId: null,
      stripePriceId: null,
      stripeScheduleId: null,
      externalRef,
    });

    const saved = await this.subscriptionsRepository.save(target);

    tenant.plan = plan;
    await this.tenantsRepository.save(tenant);

    return saved;
  }

  private async findLatestTenantSubscription(tenantId: string) {
    return this.subscriptionsRepository.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  private assertUpgradeOnly(
    currentPlan: TenantPlan,
    requestedPlan: TenantPlan,
  ) {
    const currentRank = PLAN_ORDER[currentPlan] ?? 0;
    const requestedRank = PLAN_ORDER[requestedPlan] ?? 0;

    if (requestedRank <= currentRank) {
      throw new BadRequestException(
        'You can only purchase a higher plan than your current plan',
      );
    }
  }

  private mapStripeStatus(raw: string): SubscriptionStatus {
    switch (raw.toLowerCase()) {
      case 'trialing':
        return SubscriptionStatus.TRIALING;
      case 'active':
        return SubscriptionStatus.ACTIVE;
      case 'past_due':
      case 'unpaid':
      case 'incomplete':
      case 'incomplete_expired':
        return SubscriptionStatus.PAST_DUE;
      case 'canceled':
        return SubscriptionStatus.CANCELED;
      default:
        return SubscriptionStatus.EXPIRED;
    }
  }

  private async syncStripeSubscription(payload: Record<string, unknown>) {
    const externalRef = this.readString(payload.id);
    const metadata = payload.metadata as Record<string, unknown> | undefined;
    const tenantId = this.readString(metadata?.tenantId);

    if (!externalRef || !tenantId) {
      throw new BadRequestException(
        'Missing Stripe subscription id or tenant id',
      );
    }

    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existing =
      (await this.subscriptionsRepository.findOne({
        where: { stripeSubscriptionId: externalRef },
        order: { createdAt: 'DESC' },
      })) ?? (await this.findLatestTenantSubscription(tenantId));

    const status = this.mapStripeStatus(
      this.readString(payload.status) ?? 'incomplete',
    );

    const items = payload.items as
      | { data?: Array<Record<string, unknown>> }
      | undefined;
    const firstItem = items?.data?.[0];

    const stripePriceId = this.readString(firstItem?.price);
    const stripeSubscriptionItemId = this.readString(firstItem?.id);

    const planFromPrice = mapStripePriceToPlan(stripePriceId);
    const planFromMetadata = this.mapStripePlanToTenantPlan(
      this.readString(metadata?.requestedPlan),
    );

    const plan =
      planFromPrice ??
      planFromMetadata ??
      this.mapStripePlanToTenantPlan(this.readString(payload.plan)) ??
      tenant.plan;

    const subscription =
      existing ??
      this.subscriptionsRepository.create({
        tenantId,
        externalRef,
        plan,
        status,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        trialEndsAt: null,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeSubscriptionItemId: null,
        stripePriceId: null,
        stripeScheduleId: null,
      });

    subscription.status = status;
    subscription.plan = plan;
    subscription.currentPeriodStart = this.toDateOrFallback(
      payload.current_period_start,
      subscription.currentPeriodStart,
    );
    subscription.currentPeriodEnd = this.toDateOrFallback(
      payload.current_period_end,
      subscription.currentPeriodEnd,
    );
    subscription.trialEndsAt = this.toDateOrNull(payload.trial_end);
    subscription.canceledAt = this.toDateOrNull(payload.canceled_at);
    subscription.cancelAtPeriodEnd = Boolean(payload.cancel_at_period_end);
    subscription.stripeCustomerId = this.readString(payload.customer);
    subscription.stripeSubscriptionId = externalRef;
    subscription.stripeSubscriptionItemId = stripeSubscriptionItemId;
    subscription.stripePriceId = stripePriceId;
    subscription.externalRef = externalRef;

    const saved = await this.subscriptionsRepository.save(subscription);

    // Only update tenant.plan if this is the most recent subscription.
    // A newer SPEI-based record (created by applyPlanToTenant) takes precedence.
    const latestSub = await this.findLatestTenantSubscription(tenantId);
    if (!latestSub || latestSub.id === saved.id) {
      tenant.plan =
        status === SubscriptionStatus.CANCELED &&
        saved.currentPeriodEnd.getTime() <= Date.now()
          ? TenantPlan.FREE
          : saved.plan;
      await this.tenantsRepository.save(tenant);
    }

    const requestId = this.readString(metadata?.planChangeRequestId);
    if (requestId) {
      await this.completePlanChangeRequestFromSubscriptionEvent(
        requestId,
        payload,
      );
    }

    return saved;
  }

  private async completePlanChangeRequestFromSubscriptionEvent(
    requestId: string,
    payload: Record<string, unknown>,
  ) {
    const request = await this.planChangeRequestsRepository.findOne({
      where: { id: requestId },
    });
    if (!request) return;

    if (request.status !== PlanChangeRequestStatus.PENDING_PAYMENT) return;

    request.status = PlanChangeRequestStatus.COMPLETED;
    request.reviewedAt = new Date();
    request.reviewNotes =
      'Auto-completed by Stripe customer.subscription webhook';
    request.stripePaymentIntentId =
      this.readString(payload.latest_invoice) ?? request.stripePaymentIntentId;

    await this.planChangeRequestsRepository.save(request);
  }

  private mapStripePlanToTenantPlan(raw: string | null): TenantPlan | null {
    if (!raw) return null;

    const normalized = raw.toLowerCase();

    if (normalized.includes('pro')) return TenantPlan.PRO;
    if (normalized.includes('basic')) return TenantPlan.BASIC;
    if (normalized.includes('free')) return TenantPlan.FREE;

    return null;
  }

  private toDateOrFallback(value: unknown, fallback: Date): Date {
    const parsed = this.toDateOrNull(value);
    return parsed ?? fallback;
  }

  private parseIsoDateOrThrow(value: string, fieldName: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid ISO date`);
    }
    return parsed;
  }

  private assertValidPeriodRange(start: Date, end: Date) {
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException(
        'currentPeriodEnd must be later than currentPeriodStart',
      );
    }
  }

  private toDateOrNull(value: unknown): Date | null {
    if (value == null) return null;

    if (typeof value === 'number') {
      return new Date(value * 1000);
    }

    if (typeof value === 'string') {
      const asNumber = Number(value);
      if (!Number.isNaN(asNumber)) {
        return new Date(asNumber * 1000);
      }

      const asDate = new Date(value);
      if (!Number.isNaN(asDate.getTime())) {
        return asDate;
      }
    }

    return null;
  }

  private readString(value: unknown): string | null {
    if (typeof value === 'string') return value;

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (typeof record.id === 'string') return record.id;
      if (typeof record.lookup_key === 'string') return record.lookup_key;
      if (typeof record.nickname === 'string') return record.nickname;
    }

    return null;
  }

  private async getStripeClient() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeSecretKey) {
      throw new BadRequestException('Missing STRIPE_SECRET_KEY');
    }

    const stripeModule = (await import('stripe')) as unknown as StripeModule;
    return new stripeModule.default(stripeSecretKey);
  }

  async scheduleStripeDowngrade(
    tenantId: string,
    targetPlan: TenantPlan,
    actor: AuthenticatedUser,
  ) {
    this.assertTenantAccess(tenantId, actor);

    if (targetPlan === TenantPlan.FREE) {
      throw new BadRequestException('Use cancelAutoRenew to downgrade to FREE');
    }

    const subscription = await this.findLatestTenantSubscription(tenantId);
    if (!subscription?.stripeSubscriptionId) {
      throw new BadRequestException(
        'No Stripe subscription found. Use SPEI change-request for SPEI subscriptions.',
      );
    }

    const currentRank = PLAN_ORDER[subscription.plan] ?? 0;
    const targetRank = PLAN_ORDER[targetPlan] ?? 0;
    if (targetRank >= currentRank) {
      throw new BadRequestException(
        'Use the plan change request flow for upgrades',
      );
    }

    const targetPriceId = getRecurringPlanPriceId(targetPlan);
    if (!targetPriceId) {
      throw new BadRequestException(
        `Missing STRIPE_PRICE_ID_${targetPlan} environment variable`,
      );
    }

    const stripe = await this.getStripeClient();
    const scheduleClient = stripe as unknown as StripeScheduleClient;

    const stripeSub = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );

    // If the subscription already has a schedule attached, reuse it.
    const attachedScheduleId = this.readString(stripeSub.schedule);

    let scheduleId = attachedScheduleId;
    if (!scheduleId) {
      const schedule = await scheduleClient.subscriptionSchedules.create({
        from_subscription: subscription.stripeSubscriptionId,
      });

      scheduleId = this.readString(schedule.id);
      if (!scheduleId) {
        throw new BadRequestException(
          'Failed to create Stripe subscription schedule',
        );
      }
    }

    const currentPeriodEnd =
      this.readNumber(stripeSub.current_period_end) ??
      Math.floor(subscription.currentPeriodEnd.getTime() / 1000);
    const currentPeriodStart = this.readNumber(stripeSub.current_period_start);
    const currentPriceId =
      subscription.stripePriceId ??
      this.readString(
        (
          stripeSub.items as
            | { data: Array<Record<string, unknown>> }
            | undefined
        )?.data?.[0]?.price,
      );

    if (!currentPriceId) {
      throw new BadRequestException(
        'Could not determine current Stripe price ID',
      );
    }

    if (!Number.isFinite(currentPeriodEnd) || currentPeriodEnd <= 0) {
      throw new BadRequestException(
        'Could not determine a valid Stripe current_period_end timestamp',
      );
    }

    const schedule =
      await scheduleClient.subscriptionSchedules.retrieve(scheduleId);
    const currentPhase = schedule.current_phase as
      | Record<string, unknown>
      | undefined;
    const currentPhaseStart = this.readNumber(currentPhase?.start_date);

    const candidatePhaseStarts = [currentPeriodStart, currentPhaseStart].filter(
      (value): value is number =>
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value > 0 &&
        value < currentPeriodEnd,
    );
    const phaseStart = candidatePhaseStarts[0] ?? null;

    if (!Number.isFinite(phaseStart) || (phaseStart ?? 0) <= 0) {
      throw new BadRequestException(
        'Could not determine a valid Stripe phase start_date before current_period_end',
      );
    }

    await scheduleClient.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'release',
      phases: [
        {
          start_date: phaseStart,
          end_date: currentPeriodEnd,
          items: [{ price: currentPriceId, quantity: 1 }],
          proration_behavior: 'none',
        },
        {
          items: [{ price: targetPriceId, quantity: 1 }],
          proration_behavior: 'none',
        },
      ],
    });

    subscription.stripeScheduleId = scheduleId;
    return this.subscriptionsRepository.save(subscription);
  }

  async cancelSpeiAtPeriodEnd(tenantId: string, actor: AuthenticatedUser) {
    this.assertSuperAdmin(actor);

    const subscription = await this.findLatestTenantSubscription(tenantId);
    if (!subscription) {
      throw new NotFoundException('No subscription found for this tenant');
    }

    if (subscription.stripeSubscriptionId) {
      throw new BadRequestException(
        'This subscription has a Stripe subscription. Use cancelAutoRenew instead.',
      );
    }

    subscription.cancelAtPeriodEnd = true;
    return this.subscriptionsRepository.save(subscription);
  }

  private readNumber(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private getBillingBaseUrl() {
    const billingBaseUrl = process.env.BILLING_BASE_URL?.trim();
    if (!billingBaseUrl) {
      throw new InternalServerErrorException(
        'Missing BILLING_BASE_URL environment variable',
      );
    }

    return billingBaseUrl.endsWith('/')
      ? billingBaseUrl.slice(0, -1)
      : billingBaseUrl;
  }
}
