import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EvaluationEntity } from './evaluation.entity';

@Entity({ name: 'evaluation_items' })
export class EvaluationItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  evaluationId!: string;

  @ManyToOne(() => EvaluationEntity, (evaluation) => evaluation.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'evaluationId' })
  evaluation!: EvaluationEntity;

  @Column({ type: 'varchar', length: 80 })
  criterionCode!: string;

  @Column({ type: 'varchar', length: 160 })
  criterionLabel!: string;

  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
