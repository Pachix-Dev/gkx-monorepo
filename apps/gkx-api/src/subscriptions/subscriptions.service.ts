import {
  BadRequestException,
  ForbiddenException,
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
  PlanChangeRequestEntity,
  PlanChangeRequestStatus,
  PlanPaymentMethod,
} from './plan-change-request.entity';
import { getPlanOffers } from './plan-offers.config';
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
    };
  };
};

type StripeModule = {
  default: new (apiKey: string) => StripeClient;
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

    const subscription = this.subscriptionsRepository.create({
      tenantId: dto.tenantId,
      plan: dto.plan,
      status: dto.status ?? SubscriptionStatus.TRIALING,
      currentPeriodStart: new Date(dto.currentPeriodStart),
      currentPeriodEnd: new Date(dto.currentPeriodEnd),
      trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
      canceledAt: null,
      externalRef: dto.externalRef ?? null,
    });

    const saved = await this.subscriptionsRepository.save(subscription);

    // sync tenant plan
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
          s.status === SubscriptionStatus.TRIALING,
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

    if (dto.plan !== undefined) subscription.plan = dto.plan;
    if (dto.status !== undefined) subscription.status = dto.status;
    if (dto.currentPeriodStart !== undefined)
      subscription.currentPeriodStart = new Date(dto.currentPeriodStart);
    if (dto.currentPeriodEnd !== undefined)
      subscription.currentPeriodEnd = new Date(dto.currentPeriodEnd);
    if (dto.trialEndsAt !== undefined)
      subscription.trialEndsAt = new Date(dto.trialEndsAt);
    if (dto.canceledAt !== undefined)
      subscription.canceledAt = new Date(dto.canceledAt);
    if (dto.externalRef !== undefined)
      subscription.externalRef = dto.externalRef;

    const saved = await this.subscriptionsRepository.save(subscription);

    // sync tenant plan when plan changes
    if (dto.plan !== undefined) {
      const tenant = await this.tenantsRepository.findOne({
        where: { id: subscription.tenantId },
      });
      if (tenant) {
        tenant.plan = dto.plan;
        await this.tenantsRepository.save(tenant);
      }
    }

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

    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (dto.plan === TenantPlan.FREE) {
      throw new BadRequestException('Use FREE only for internal/manual ops');
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
          'Pago por SPEI registrado. SUPER_ADMIN validara el pago y activara el plan.',
      };
    }

    const checkoutUrl = await this.createCardCheckoutSession(saved);

    saved.stripeCheckoutSessionId = checkoutUrl.sessionId;
    await this.planChangeRequestsRepository.save(saved);

    return {
      request: saved,
      checkoutUrl: checkoutUrl.url,
    };
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

    const request = await this.planChangeRequestsRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Plan change request not found');

    if (request.paymentMethod !== PlanPaymentMethod.SPEI) {
      throw new BadRequestException('Only SPEI requests can be reviewed manually');
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

    await this.applyPlanToTenant(request.tenantId, request.requestedPlan, 'spei-manual-approval');

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

    const externalRef = this.readString(payload.id);
    const metadata = payload.metadata as Record<string, unknown> | undefined;
    const tenantId =
      this.readString(metadata?.tenantId) ?? this.readString(payload.tenantId);

    if (!externalRef || !tenantId) {
      return { applied: false, reason: 'Missing subscription id or tenant id' };
    }

    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      return { applied: false, reason: 'Tenant not found' };
    }

    const existing = await this.subscriptionsRepository.findOne({
      where: { externalRef },
      order: { createdAt: 'DESC' },
    });

    const stripePlanRaw = this.readString(
      (payload.items as { data?: Array<Record<string, unknown>> } | undefined)
        ?.data?.[0]?.price,
    );

    const status = this.mapStripeStatus(
      this.readString(payload.status) ?? 'incomplete',
    );

    const subscription = existing
      ? existing
      : this.subscriptionsRepository.create({
          tenantId,
          externalRef,
          plan: tenant.plan,
          status,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
          trialEndsAt: null,
          canceledAt: null,
        });

    subscription.status = status;
    subscription.plan =
      this.mapStripePlanToTenantPlan(stripePlanRaw) ?? tenant.plan;
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
    subscription.externalRef = externalRef;

    const saved = await this.subscriptionsRepository.save(subscription);

    tenant.plan = saved.plan;
    await this.tenantsRepository.save(tenant);

    return { applied: true, subscriptionId: saved.id };
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

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    const stripeModule = (await import('stripe')) as unknown as StripeModule;
    const stripe = new stripeModule.default(
      stripeSecretKey || 'sk_test_placeholder',
    );

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

    if (request.status !== PlanChangeRequestStatus.PENDING_PAYMENT) {
      return false;
    }

    await this.applyPlanToTenant(
      request.tenantId,
      request.requestedPlan,
      this.readString(payload.id) ?? 'stripe-checkout',
    );

    request.status = PlanChangeRequestStatus.COMPLETED;
    request.stripeCheckoutSessionId =
      this.readString(payload.id) ?? request.stripeCheckoutSessionId;
    request.stripePaymentIntentId =
      this.readString(payload.payment_intent) ?? request.stripePaymentIntentId;
    request.reviewedAt = new Date();
    request.reviewNotes = 'Auto-completed by Stripe checkout.session.completed';

    await this.planChangeRequestsRepository.save(request);
    return true;
  }

  private async createCardCheckoutSession(request: PlanChangeRequestEntity) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeSecretKey) {
      throw new BadRequestException('Missing STRIPE_SECRET_KEY');
    }

    const billingBaseUrl =
      process.env.BILLING_BASE_URL?.trim() ?? 'http://localhost:3001';

    const offer = getPlanOffers().find((item) => item.plan === request.requestedPlan);
    if (!offer) {
      throw new BadRequestException('Plan offer not configured');
    }

    const stripeModule = (await import('stripe')) as unknown as StripeModule;
    const stripe = new stripeModule.default(stripeSecretKey);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: `${billingBaseUrl}/billing?payment=success`,
      cancel_url: `${billingBaseUrl}/billing?payment=cancelled`,
      metadata: {
        tenantId: request.tenantId,
        requestedPlan: request.requestedPlan,
        planChangeRequestId: request.id,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'mxn',
            unit_amount: Math.round(offer.monthlyPriceMxn * 100),
            product_data: {
              name: `GKX ${offer.label} plan`,
              description: `Cambio de plan a ${offer.label}`,
            },
          },
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
    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await this.subscriptionsRepository.findOne({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    const target =
      subscription ??
      this.subscriptionsRepository.create({
        tenantId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: null,
        canceledAt: null,
        externalRef,
      });

    target.plan = plan;
    target.status = SubscriptionStatus.ACTIVE;
    target.currentPeriodStart = now;
    target.currentPeriodEnd = periodEnd;
    target.externalRef = externalRef;

    const saved = await this.subscriptionsRepository.save(target);

    tenant.plan = plan;
    await this.tenantsRepository.save(tenant);

    return saved;
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

  private mapStripePlanToTenantPlan(raw: string | null): TenantPlan | null {
    if (!raw) return null;
    const normalized = raw.toLowerCase();

    if (normalized.includes('enterprise')) return TenantPlan.ENTERPRISE;
    if (normalized.includes('pro')) return TenantPlan.PRO;
    if (normalized.includes('basic')) return TenantPlan.BASIC;
    if (normalized.includes('free')) return TenantPlan.FREE;

    return null;
  }

  private toDateOrFallback(value: unknown, fallback: Date): Date {
    const parsed = this.toDateOrNull(value);
    return parsed ?? fallback;
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
}
