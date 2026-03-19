import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';
import { CoachEntity } from './coach.entity';
import { CoachesController } from './coaches.controller';
import { CoachesService } from './coaches.service';

@Module({
  imports: [TypeOrmModule.forFeature([CoachEntity, TenantEntity, UserEntity])],
  controllers: [CoachesController],
  providers: [CoachesService],
  exports: [CoachesService, TypeOrmModule],
})
export class CoachesModule {}
