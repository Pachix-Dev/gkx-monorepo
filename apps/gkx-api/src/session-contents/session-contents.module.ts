import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingContentEntity } from '../training-contents/training-content.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { SessionContentEntity } from './session-content.entity';
import { SessionContentsController } from './session-contents.controller';
import { SessionContentsNestedController } from './session-contents-nested.controller';
import { SessionContentsService } from './session-contents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionContentEntity,
      TenantEntity,
      TrainingSessionEntity,
      TrainingContentEntity,
    ]),
  ],
  controllers: [SessionContentsController, SessionContentsNestedController],
  providers: [SessionContentsService],
  exports: [SessionContentsService, TypeOrmModule],
})
export class SessionContentsModule {}
