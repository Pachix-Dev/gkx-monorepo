import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { UserEntity } from '../users/user.entity';
import { EvaluationItemEntity } from './evaluation-item.entity';

@Entity({ name: 'evaluations' })
export class EvaluationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity;

  @Column({ type: 'uuid' })
  goalkeeperId!: string;

  @ManyToOne(() => GoalkeeperEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goalkeeperId' })
  goalkeeper!: GoalkeeperEntity;

  @Column({ type: 'uuid', nullable: true })
  trainingSessionId!: string | null;

  @ManyToOne(() => TrainingSessionEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'trainingSessionId' })
  trainingSession!: TrainingSessionEntity | null;

  @Column({ type: 'uuid' })
  evaluatedByUserId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluatedByUserId' })
  evaluator!: UserEntity;

  @Column({ type: 'date' })
  evaluationDate!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallScore!: number;

  @Column({ type: 'text', nullable: true })
  generalComment!: string | null;

  @OneToMany(() => EvaluationItemEntity, (item) => item.evaluation, {
    cascade: true,
    eager: true,
  })
  items!: EvaluationItemEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
