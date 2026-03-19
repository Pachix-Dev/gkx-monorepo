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
import { TrainingContentEntity } from '../training-contents/training-content.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';

@Entity({ name: 'session_contents' })
export class SessionContentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity;

  @Column({ type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => TrainingSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session!: TrainingSessionEntity;

  @Column({ type: 'uuid' })
  trainingContentId!: string;

  @ManyToOne(() => TrainingContentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainingContentId' })
  trainingContent!: TrainingContentEntity;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'int', nullable: true })
  customDurationMinutes!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
