import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantPlan } from '../tenants/tenant.entity';

export enum PlanPaymentMethod {
  CARD = 'CARD',
  SPEI = 'SPEI',
}

export enum PlanChangeRequestStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'plan_change_requests' })
export class PlanChangeRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'uuid', nullable: true })
  requestedByUserId!: string | null;

  @Column({ type: 'enum', enum: TenantPlan })
  requestedPlan!: TenantPlan;

  @Column({ type: 'enum', enum: PlanPaymentMethod })
  paymentMethod!: PlanPaymentMethod;

  @Column({
    type: 'enum',
    enum: PlanChangeRequestStatus,
    default: PlanChangeRequestStatus.PENDING_PAYMENT,
  })
  status!: PlanChangeRequestStatus;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripeCheckoutSessionId!: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  stripePaymentIntentId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reviewNotes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
