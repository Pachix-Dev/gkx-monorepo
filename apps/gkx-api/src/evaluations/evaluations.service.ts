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
import { GoalkeeperEntity } from '../goalkeepers/goalkeeper.entity';
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationEntity } from './evaluation.entity';
import { EvaluationItemEntity } from './evaluation-item.entity';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectRepository(EvaluationEntity)
    private readonly evaluationsRepository: Repository<EvaluationEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(GoalkeeperEntity)
    private readonly goalkeepersRepository: Repository<GoalkeeperEntity>,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepository: Repository<TrainingSessionEntity>,
  ) {}

  async create(dto: CreateEvaluationDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    await this.ensureTenantExists(tenantId);
    await this.ensureGoalkeeperBelongsToTenant(dto.goalkeeperId, tenantId);
    await this.ensureSessionBelongsToTenant(dto.trainingSessionId, tenantId);

    const normalizedItems = this.normalizeItems(dto.items);

    const entity = this.evaluationsRepository.create({
      tenantId,
      trainingSessionId: dto.trainingSessionId,
      goalkeeperId: dto.goalkeeperId,
      evaluatedByUserId: actor.userId,
      evaluationDate: dto.evaluationDate,
      overallScore: this.calculateOverallScore(normalizedItems),
      generalComment: dto.generalComment ?? null,
      items: normalizedItems,
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

  async findBySession(sessionId: string, actor: AuthenticatedUser) {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    this.assertTenantAccess(session.tenantId, actor);

    return this.evaluationsRepository.find({
      where: {
        tenantId: session.tenantId,
        trainingSessionId: sessionId,
      },
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
      await this.ensureGoalkeeperBelongsToTenant(
        dto.goalkeeperId,
        entity.tenantId,
      );
    }

    if (dto.trainingSessionId) {
      await this.ensureSessionBelongsToTenant(
        dto.trainingSessionId,
        entity.tenantId,
      );
    }

    const nextItems = dto.items ? this.normalizeItems(dto.items) : entity.items;

    Object.assign(entity, {
      trainingSessionId: dto.trainingSessionId ?? entity.trainingSessionId,
      goalkeeperId: dto.goalkeeperId ?? entity.goalkeeperId,
      evaluationDate: dto.evaluationDate ?? entity.evaluationDate,
      generalComment: dto.generalComment ?? entity.generalComment,
      overallScore: this.calculateOverallScore(nextItems),
      items: nextItems,
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
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
  }

  private async ensureGoalkeeperBelongsToTenant(
    goalkeeperId: string,
    tenantId: string,
  ) {
    const goalkeeper = await this.goalkeepersRepository.findOne({
      where: { id: goalkeeperId },
    });
    if (!goalkeeper)
      throw new NotFoundException('Goalkeeper profile not found');
    if (goalkeeper.tenantId !== tenantId) {
      throw new BadRequestException(
        'Goalkeeper does not belong to the provided tenant',
      );
    }
  }

  private async ensureSessionBelongsToTenant(
    sessionId: string,
    tenantId: string,
  ) {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Training session not found');
    if (session.tenantId !== tenantId) {
      throw new BadRequestException(
        'Training session does not belong to the provided tenant',
      );
    }
  }

  private normalizeItems(items: CreateEvaluationDto['items']) {
    if (!items?.length) {
      throw new BadRequestException('At least one evaluation item is required');
    }

    return items.map((item) => {
      const entity = new EvaluationItemEntity();
      entity.criterionCode = item.criterionCode.trim();
      entity.criterionLabel = item.criterionLabel.trim();
      entity.score = item.score;
      entity.comment = item.comment?.trim() || null;
      return entity;
    });
  }

  private calculateOverallScore(items: EvaluationItemEntity[]) {
    const total = items.reduce((acc, item) => acc + Number(item.score), 0);
    return Number((total / items.length).toFixed(2));
  }
}
