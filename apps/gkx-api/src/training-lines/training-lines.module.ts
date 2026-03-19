import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingLineEntity } from './training-line.entity';
import { TrainingLinesController } from './training-lines.controller';
import { TrainingLinesService } from './training-lines.service';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingLineEntity, TenantEntity])],
  controllers: [TrainingLinesController],
  providers: [TrainingLinesService],
  exports: [TrainingLinesService, TypeOrmModule],
})
export class TrainingLinesModule {}
