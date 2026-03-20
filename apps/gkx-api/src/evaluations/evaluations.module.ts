import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';
import { EvaluationEntity } from './evaluation.entity';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EvaluationEntity,
      TenantEntity,
      GoalkeeperEntity,
      UserEntity,
    ]),
  ],
  controllers: [EvaluationsController],
  providers: [EvaluationsService],
  exports: [EvaluationsService, TypeOrmModule],
})
export class EvaluationsModule {}
