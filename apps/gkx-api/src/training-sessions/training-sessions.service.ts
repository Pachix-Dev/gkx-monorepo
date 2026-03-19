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
import { TenantEntity } from '../tenants/tenant.entity';
import { TeamEntity } from '../teams/team.entity';
import { CreateTrainingSessionDto } from './dto/create-training-session.dto';
import { UpdateTrainingSessionDto } from './dto/update-training-session.dto';
import {
  TrainingSessionEntity,
  TrainingSessionStatus,
} from './training-session.entity';

@Injectable()
export class TrainingSessionsService {
  constructor(
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepository: Repository<TrainingSessionEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(CoachEntity)
    private readonly coachesRepository: Repository<CoachEntity>,
    @InjectRepository(TeamEntity)
    private readonly teamsRepository: Repository<TeamEntity>,
  ) {}

  async create(dto: CreateTrainingSessionDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);

    await this.ensureTenantExists(tenantId);
    await this.ensureCoachBelongsToTenant(dto.coachId, tenantId);
    await this.ensureTeamBelongsToTenant(dto.teamId, tenantId);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    this.assertTimeRange(startTime, endTime);

    const entity = this.sessionsRepository.create({
      tenantId,
      title: dto.title,
      description: dto.description ?? null,
      date: dto.date,
      startTime,
      endTime,
      coachId: dto.coachId ?? null,
      teamId: dto.teamId ?? null,
      location: dto.location ?? null,
      notes: dto.notes ?? null,
      status: dto.status ?? TrainingSessionStatus.DRAFT,
    });

    return this.sessionsRepository.save(entity);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return this.sessionsRepository.find({ order: { createdAt: 'DESC' } });
    }

    return this.sessionsRepository.find({
      where: { tenantId: actor.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.sessionsRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Training session not found');
    }

    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async update(
    id: string,
    dto: UpdateTrainingSessionDto,
    actor: AuthenticatedUser,
  ) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    if (dto.coachId) {
      await this.ensureCoachBelongsToTenant(dto.coachId, entity.tenantId);
    }

    if (dto.teamId) {
      await this.ensureTeamBelongsToTenant(dto.teamId, entity.tenantId);
    }

    const nextStartTime = dto.startTime ? new Date(dto.startTime) : entity.startTime;
    const nextEndTime = dto.endTime ? new Date(dto.endTime) : entity.endTime;
    this.assertTimeRange(nextStartTime, nextEndTime);

    Object.assign(entity, {
      title: dto.title ?? entity.title,
      description: dto.description ?? entity.description,
      date: dto.date ?? entity.date,
      startTime: nextStartTime,
      endTime: nextEndTime,
      coachId: dto.coachId ?? entity.coachId,
      teamId: dto.teamId ?? entity.teamId,
      location: dto.location ?? entity.location,
      notes: dto.notes ?? entity.notes,
      status: dto.status ?? entity.status,
    });

    return this.sessionsRepository.save(entity);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.sessionsRepository.remove(entity);
    return { deleted: true };
  }

  private resolveTenantIdForCreate(
    requestedTenantId: string,
    actor: AuthenticatedUser,
  ): string {
    if (actor.role === Role.SUPER_ADMIN) return requestedTenantId;
    if (requestedTenantId !== actor.tenantId) {
      throw new ForbiddenException(
        'You can only create records within your own tenant',
      );
    }
    return actor.tenantId;
  }

  private assertTenantAccess(tenantId: string, actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) return;
    if (tenantId !== actor.tenantId) {
      throw new ForbiddenException(
        'You can only access records within your own tenant',
      );
    }
  }

  private assertTimeRange(startTime: Date, endTime: Date) {
    if (endTime.getTime() <= startTime.getTime()) {
      throw new BadRequestException('endTime must be greater than startTime');
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
    if (!coachId) return;

    const coach = await this.coachesRepository.findOne({ where: { id: coachId } });
    if (!coach) {
      throw new NotFoundException('Coach profile not found');
    }

    if (coach.tenantId !== tenantId) {
      throw new BadRequestException('Coach does not belong to the provided tenant');
    }
  }

  private async ensureTeamBelongsToTenant(teamId: string | undefined, tenantId: string) {
    if (!teamId) return;

    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.tenantId !== tenantId) {
      throw new BadRequestException('Team does not belong to the provided tenant');
    }
  }
}
