import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExerciseEntity } from '../exercises/exercise.entity';
import { SessionContentEntity } from '../session-contents/session-content.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';

@Entity({ name: 'session_exercises' })
export class SessionExerciseEntity {
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
  sessionContentId!: string;

  @ManyToOne(() => SessionContentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionContentId' })
  sessionContent!: SessionContentEntity;

  @Column({ type: 'uuid' })
  exerciseId!: string;

  @ManyToOne(() => ExerciseEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exerciseId' })
  exercise!: ExerciseEntity;

  @Column({ type: 'boolean', default: true })
  selected!: boolean;

  // Tactical design snapshot (frozen at assignment time for field sheets)
  @Column({ type: 'jsonb', nullable: true })
  tacticalStateSnapshot!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  tacticalPreviewUrlSnapshot!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  tacticalSnapshotCreatedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
