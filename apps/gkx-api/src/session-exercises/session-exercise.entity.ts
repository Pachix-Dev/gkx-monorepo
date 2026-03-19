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

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ type: 'boolean', default: true })
  selected!: boolean;

  @Column({ type: 'int', nullable: true })
  customDurationMinutes!: number | null;

  @Column({ type: 'int', nullable: true })
  customRepetitions!: number | null;

  @Column({ type: 'int', nullable: true })
  customRestSeconds!: number | null;

  @Column({ type: 'text', nullable: true })
  coachNotes!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
