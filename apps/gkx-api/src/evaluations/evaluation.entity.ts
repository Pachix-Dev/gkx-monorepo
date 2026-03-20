import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';

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

  @Column({ type: 'uuid' })
  coachId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachId' })
  coach!: UserEntity;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'int' })
  handling!: number;

  @Column({ type: 'int' })
  diving!: number;

  @Column({ type: 'int' })
  positioning!: number;

  @Column({ type: 'int' })
  reflexes!: number;

  @Column({ type: 'int' })
  communication!: number;

  @Column({ type: 'int' })
  footwork!: number;

  @Column({ type: 'int' })
  distribution!: number;

  @Column({ type: 'int' })
  aerialPlay!: number;

  @Column({ type: 'int' })
  oneVsOne!: number;

  @Column({ type: 'int' })
  mentality!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overallScore!: number;

  @Column({ type: 'text', nullable: true })
  comments!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
