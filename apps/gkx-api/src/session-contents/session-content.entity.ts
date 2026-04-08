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

  @Column({ type: 'uuid', nullable: true })
  trainingContentId!: string | null;

  @Column({ type: 'varchar', length: 150 })
  taskName!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
