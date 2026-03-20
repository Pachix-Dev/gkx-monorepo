import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';
import { TeamEntity } from './team.entity';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TeamEntity,
      TenantEntity,
      UserEntity,
      GoalkeeperEntity,
    ]),
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService, TypeOrmModule],
})
export class TeamsModule {}
