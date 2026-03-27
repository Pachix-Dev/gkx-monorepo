import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '../tenants/tenant.entity';
import { TenantPlan } from '../tenants/tenant.entity';

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

@Entity({ name: 'subscriptions' })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity;

  @Column({ type: 'enum', enum: TenantPlan })
  plan!: TenantPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIALING,
  })
  status!: SubscriptionStatus;

  @Column({ type: 'timestamptz' })
  currentPeriodStart!: Date;

  @Column({ type: 'timestamptz' })
  currentPeriodEnd!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  trialEndsAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  canceledAt!: Date | null;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripeCustomerId!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripeSubscriptionId!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripeSubscriptionItemId!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripePriceId!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripeScheduleId!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  externalRef!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
