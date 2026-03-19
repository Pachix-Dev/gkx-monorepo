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
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationEntity } from './evaluation.entity';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(EvaluationEntity)
    private readonly evaluationsRepository: Repository<EvaluationEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(GoalkeeperEntity)
    private readonly goalkeepersRepository: Repository<GoalkeeperEntity>,
    @InjectRepository(CoachEntity)
    private readonly coachesRepository: Repository<CoachEntity>,
  ) {}

  async create(dto: CreateEvaluationDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    await this.ensureTenantExists(tenantId);
    await this.ensureGoalkeeperBelongsToTenant(dto.goalkeeperId, tenantId);
    await this.ensureCoachBelongsToTenant(dto.coachId, tenantId);

    const entity = this.evaluationsRepository.create({
      tenantId,
      goalkeeperId: dto.goalkeeperId,
      coachId: dto.coachId,
      date: dto.date,
      handling: dto.handling,
      diving: dto.diving,
      positioning: dto.positioning,
      reflexes: dto.reflexes,
      communication: dto.communication,
      footwork: dto.footwork,
      distribution: dto.distribution,
      aerialPlay: dto.aerialPlay,
      oneVsOne: dto.oneVsOne,
      mentality: dto.mentality,
      overallScore: dto.overallScore,
      comments: dto.comments ?? null,
    });

    return this.evaluationsRepository.save(entity);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return this.evaluationsRepository.find({ order: { createdAt: 'DESC' } });
    }

    return this.evaluationsRepository.find({
      where: { tenantId: actor.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.evaluationsRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Evaluation not found');
    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async update(id: string, dto: UpdateEvaluationDto, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    if (dto.goalkeeperId) {
      await this.ensureGoalkeeperBelongsToTenant(dto.goalkeeperId, entity.tenantId);
    }

    if (dto.coachId) {
      await this.ensureCoachBelongsToTenant(dto.coachId, entity.tenantId);
    }

    Object.assign(entity, {
      goalkeeperId: dto.goalkeeperId ?? entity.goalkeeperId,
      coachId: dto.coachId ?? entity.coachId,
      date: dto.date ?? entity.date,
      handling: dto.handling ?? entity.handling,
      diving: dto.diving ?? entity.diving,
      positioning: dto.positioning ?? entity.positioning,
      reflexes: dto.reflexes ?? entity.reflexes,
      communication: dto.communication ?? entity.communication,
      footwork: dto.footwork ?? entity.footwork,
      distribution: dto.distribution ?? entity.distribution,
      aerialPlay: dto.aerialPlay ?? entity.aerialPlay,
      oneVsOne: dto.oneVsOne ?? entity.oneVsOne,
      mentality: dto.mentality ?? entity.mentality,
      overallScore: dto.overallScore ?? entity.overallScore,
      comments: dto.comments ?? entity.comments,
    });

    return this.evaluationsRepository.save(entity);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.evaluationsRepository.remove(entity);
    return { deleted: true };
  }

  private resolveTenantIdForCreate(
    requestedTenantId: string,
    actor: AuthenticatedUser,
  ) {
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

  private async ensureTenantExists(tenantId: string) {
    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
  }

  private async ensureGoalkeeperBelongsToTenant(
    goalkeeperId: string,
    tenantId: string,
  ) {
    const goalkeeper = await this.goalkeepersRepository.findOne({
      where: { id: goalkeeperId },
    });
    if (!goalkeeper) throw new NotFoundException('Goalkeeper profile not found');
    if (goalkeeper.tenantId !== tenantId) {
      throw new BadRequestException(
        'Goalkeeper does not belong to the provided tenant',
      );
    }
  }

  private async ensureCoachBelongsToTenant(coachId: string, tenantId: string) {
    const coach = await this.coachesRepository.findOne({ where: { id: coachId } });
    if (!coach) throw new NotFoundException('Coach profile not found');
    if (coach.tenantId !== tenantId) {
      throw new BadRequestException('Coach does not belong to the provided tenant');
    }
  }
}
