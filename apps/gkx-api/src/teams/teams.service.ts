import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CoachEntity } from '../coaches/coach.entity';
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamEntity } from './team.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(CoachEntity)
    private readonly coachesRepository: Repository<CoachEntity>,
    @InjectRepository(GoalkeeperEntity)
    private readonly goalkeepersRepository: Repository<GoalkeeperEntity>,
  ) {}

  async create(dto: CreateTeamDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);

    await this.ensureTenantExists(tenantId);
    await this.ensureCoachBelongsToTenant(dto.coachId, tenantId);

    const entity = this.teamsRepository.create({
      tenantId,
      name: dto.name,
      category: dto.category ?? null,
      season: dto.season ?? null,
      coachId: dto.coachId ?? null,
    });

    return this.teamsRepository.save(entity);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return this.teamsRepository.find({ order: { createdAt: 'DESC' } });
    }

    return this.teamsRepository.find({
      where: { tenantId: actor.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.teamsRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Team not found');
    }

    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async update(id: string, dto: UpdateTeamDto, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    await this.ensureCoachBelongsToTenant(dto.coachId, entity.tenantId);

    Object.assign(entity, {
      name: dto.name ?? entity.name,
      category: dto.category ?? entity.category,
      season: dto.season ?? entity.season,
      coachId: dto.coachId ?? entity.coachId,
    });

    return this.teamsRepository.save(entity);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.teamsRepository.remove(entity);
    return { deleted: true };
  }

  async assignGoalkeeper(
    teamId: string,
    goalkeeperId: string,
    actor: AuthenticatedUser,
  ) {
    const team = await this.findOne(teamId, actor);

    const goalkeeper = await this.goalkeepersRepository.findOne({
      where: { id: goalkeeperId },
    });
    if (!goalkeeper) {
      throw new NotFoundException('Goalkeeper profile not found');
    }

    this.assertTenantAccess(goalkeeper.tenantId, actor);

    if (goalkeeper.tenantId !== team.tenantId) {
      throw new BadRequestException('Goalkeeper and team must belong to the same tenant');
    }

    goalkeeper.teamId = team.id;
    const data = await this.goalkeepersRepository.save(goalkeeper);
    return data;
  }

  private resolveTenantIdForCreate(
    requestedTenantId: string,
    actor: AuthenticatedUser,
  ): string {
    if (actor.role === Role.SUPER_ADMIN) {
      return requestedTenantId;
    }

    if (requestedTenantId !== actor.tenantId) {
      throw new ForbiddenException(
        'You can only create records within your own tenant',
      );
    }

    return actor.tenantId;
  }

  private assertTenantAccess(tenantId: string, actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }

    if (tenantId !== actor.tenantId) {
      throw new ForbiddenException(
        'You can only access records within your own tenant',
      );
    }
  }

  private async ensureTenantExists(tenantId: string) {
    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
  }

  private async ensureCoachBelongsToTenant(
    coachId: string | undefined,
    tenantId: string,
  ) {
    if (!coachId) {
      return;
    }

    const coach = await this.coachesRepository.findOne({ where: { id: coachId } });
    if (!coach) {
      throw new NotFoundException('Coach profile not found');
    }

    if (coach.tenantId !== tenantId) {
      throw new BadRequestException('Coach does not belong to the provided tenant');
    }
  }
}
