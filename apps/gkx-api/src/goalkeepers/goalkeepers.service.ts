import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

interface UploadedGoalkeeperAvatar {
  mimetype: string;
  buffer: Buffer;
  originalname: string;
}
import { Role } from '../auth/roles.enum';
import { TenantEntity } from '../tenants/tenant.entity';
import { EvaluationEntity } from '../evaluations/evaluation.entity';
import { PlanLimitsService } from '../plan-limits/plan-limits.service';
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
    @InjectRepository(EvaluationEntity)
    private readonly evaluationsRepository: Repository<EvaluationEntity>,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async create(dto: CreateGoalkeeperDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    const userId = actor.userId;

    await this.ensureTenantExists(tenantId);
    await this.planLimitsService.assertWithinLimit(tenantId, 'goalkeepers');

    const existing = await this.goalkeepersRepository.findOne({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException(
        'Goalkeeper profile already exists for this user',
      );
    }

    const entity = this.goalkeepersRepository.create({
      tenantId,
      userId,
      name: dto.name,
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

    Object.assign(entity, {
      name: dto.name ?? entity.name,
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
      order: { evaluationDate: 'DESC', createdAt: 'DESC' },
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
              evaluations.reduce(
                (acc, item) => acc + Number(item.overallScore),
                0,
              ) / count
            ).toFixed(2),
          );

    const latestEvaluation = count > 0 ? evaluations[0] : null;

    return {
      evaluationsCount: count,
      averageOverallScore,
      latestEvaluationDate: latestEvaluation?.evaluationDate ?? null,
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

  async uploadAvatar(
    id: string,
    file: UploadedGoalkeeperAvatar,
    actor: AuthenticatedUser,
  ) {
    const entity = await this.findOne(id, actor);

    const uploadsDir = resolve(
      process.cwd(),
      process.env.LOCAL_UPLOADS_DIR ?? 'uploads',
      'goalkeeper-avatars',
    );
    mkdirSync(uploadsDir, { recursive: true });

    if (entity.avatarUrl) {
      const relative = entity.avatarUrl.replace(/^\/uploads\//, '');
      const oldPath = resolve(
        process.cwd(),
        process.env.LOCAL_UPLOADS_DIR ?? 'uploads',
        relative,
      );
      try {
        unlinkSync(oldPath);
      } catch {
        // File may not exist on disk; ignore.
      }
    }

    const ext = (extname(file.originalname) || '.jpg').toLowerCase();
    const filename = `${entity.id}${ext}`;
    writeFileSync(resolve(uploadsDir, filename), file.buffer);

    entity.avatarUrl = `/uploads/goalkeeper-avatars/${filename}`;
    return this.goalkeepersRepository.save(entity);
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
    const tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
  }
}
