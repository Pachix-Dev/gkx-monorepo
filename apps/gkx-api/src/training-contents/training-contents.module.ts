import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingLineEntity } from '../training-lines/training-line.entity';
import { UserEntity } from '../users/user.entity';
import { TrainingContentEntity } from './training-content.entity';
import { TrainingContentsController } from './training-contents.controller';
import { TrainingContentsNestedController } from './training-contents-nested.controller';
import { TrainingContentsService } from './training-contents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrainingContentEntity,
      TenantEntity,
      TrainingLineEntity,
      UserEntity,
    ]),
  ],
  controllers: [TrainingContentsController, TrainingContentsNestedController],
  providers: [TrainingContentsService],
  exports: [TrainingContentsService, TypeOrmModule],
})
export class TrainingContentsModule {}
