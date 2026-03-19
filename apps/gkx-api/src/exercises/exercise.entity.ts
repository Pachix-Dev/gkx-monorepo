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

export enum ExerciseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity({ name: 'exercises' })
export class ExerciseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantEntity;

  @Column({ type: 'uuid' })
  trainingContentId!: string;

  @ManyToOne(() => TrainingContentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainingContentId' })
  trainingContent!: TrainingContentEntity;

  @Column({ type: 'varchar', length: 180 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  instructions!: string | null;

  @Column({ type: 'text', nullable: true })
  objective!: string | null;

  @Column({ type: 'int', nullable: true })
  durationMinutes!: number | null;

  @Column({ type: 'int', nullable: true })
  repetitions!: number | null;

  @Column({ type: 'int', nullable: true })
  restSeconds!: number | null;

  @Column({ type: 'text', nullable: true })
  equipment!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  difficulty!: string | null;

  @Column({ type: 'int', default: 0 })
  order!: number;

  @Column({ type: 'enum', enum: ExerciseStatus, default: ExerciseStatus.ACTIVE })
  status!: ExerciseStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
