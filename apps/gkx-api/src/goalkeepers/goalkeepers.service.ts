import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { TenantEntity } from '../tenants/tenant.entity';
import { UserEntity } from '../users/user.entity';
import { EvaluationEntity } from '../evaluations/evaluation.entity';
import { CreateGoalkeeperDto } from './dto/create-goalkeeper.dto';
import { UpdateGoalkeeperDto } from './dto/update-goalkeeper.dto';
import { GoalkeeperEntity } from './goalkeeper.entity';

@Injectable()
export class GoalkeepersService {
  constructor(
    @InjectRepository(GoalkeeperEntity)
    private readonly goalkeepersRepository: Repository<GoalkeeperEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(EvaluationEntity)
    private readonly evaluationsRepository: Repository<EvaluationEntity>,
  ) {}

  async create(dto: CreateGoalkeeperDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);

    await this.ensureTenantExists(tenantId);
    await this.ensureUserBelongsToTenant(dto.userId, tenantId);

    const existing = await this.goalkeepersRepository.findOne({
      where: { userId: dto.userId },
    });
    if (existing) {
      throw new ConflictException('Goalkeeper profile already exists for this user');
    }

    const entity = this.goalkeepersRepository.create({
      tenantId,
      userId: dto.userId,
      dateOfBirth: dto.dateOfBirth ?? null,
      dominantHand: dto.dominantHand ?? null,
      dominantFoot: dto.dominantFoot ?? null,
      height: dto.height ?? null,
      weight: dto.weight ?? null,
      category: dto.category ?? null,
      teamId: dto.teamId ?? null,
      medicalNotes: dto.medicalNotes ?? null,
      parentContact: dto.parentContact ?? null,
    });

    return this.goalkeepersRepository.save(entity);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return this.goalkeepersRepository.find({ order: { createdAt: 'DESC' } });
    }

    return this.goalkeepersRepository.find({
      where: { tenantId: actor.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.goalkeepersRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Goalkeeper profile not found');
    }

    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async update(id: string, dto: UpdateGoalkeeperDto, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    if (dto.userId && dto.userId !== entity.userId) {
      throw new BadRequestException('Changing userId is not allowed');
    }

    Object.assign(entity, {
      dateOfBirth: dto.dateOfBirth ?? entity.dateOfBirth,
      dominantHand: dto.dominantHand ?? entity.dominantHand,
      dominantFoot: dto.dominantFoot ?? entity.dominantFoot,
      height: dto.height ?? entity.height,
      weight: dto.weight ?? entity.weight,
      category: dto.category ?? entity.category,
      teamId: dto.teamId ?? entity.teamId,
      medicalNotes: dto.medicalNotes ?? entity.medicalNotes,
      parentContact: dto.parentContact ?? entity.parentContact,
    });

    return this.goalkeepersRepository.save(entity);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.goalkeepersRepository.remove(entity);
    return { deleted: true };
  }

  async getEvaluations(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);

    return this.evaluationsRepository.find({
      where: {
        tenantId: entity.tenantId,
        goalkeeperId: entity.id,
      },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async getProgress(id: string, actor: AuthenticatedUser) {
    const evaluations = await this.getEvaluations(id, actor);
    const count = evaluations.length;

    const averageOverallScore =
      count === 0
        ? null
        : Number(
            (
              evaluations.reduce((acc, item) => acc + Number(item.overallScore), 0) /
              count
            ).toFixed(2),
          );

    const latestEvaluation = count > 0 ? evaluations[0] : null;

    return {
      evaluationsCount: count,
      averageOverallScore,
      latestEvaluationDate: latestEvaluation?.date ?? null,
      latestOverallScore:
        latestEvaluation?.overallScore !== undefined
          ? Number(latestEvaluation.overallScore)
          : null,
    };
  }

  async getMetrics(id: string, actor: AuthenticatedUser) {
    await this.findOne(id, actor);

    // Metrics module is pending; return stable contract for now.
    return {
      goalkeeperId: id,
      records: [],
    };
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

  private async ensureUserBelongsToTenant(userId: string, tenantId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tenantId !== tenantId) {
      throw new BadRequestException('User does not belong to the provided tenant');
    }
  }
}
