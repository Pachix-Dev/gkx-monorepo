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
import { TenantEntity } from '../tenants/tenant.entity';
import { TrainingContentEntity } from '../training-contents/training-content.entity';
import { TrainingSessionEntity } from '../training-sessions/training-session.entity';
import { CreateSessionContentDto } from './dto/create-session-content.dto';
import { UpdateSessionContentDto } from './dto/update-session-content.dto';
import { SessionContentEntity } from './session-content.entity';

@Injectable()
export class SessionContentsService {
  constructor(
    @InjectRepository(SessionContentEntity)
    private readonly sessionContentsRepository: Repository<SessionContentEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepository: Repository<TrainingSessionEntity>,
    @InjectRepository(TrainingContentEntity)
    private readonly contentsRepository: Repository<TrainingContentEntity>,
  ) {}

  async create(dto: CreateSessionContentDto, actor: AuthenticatedUser) {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    await this.ensureTenantExists(tenantId);

    const session = await this.ensureSessionBelongsToTenant(dto.sessionId, tenantId);
    const content = await this.ensureContentBelongsToTenant(
      dto.trainingContentId,
      tenantId,
    );

    const entity = this.sessionContentsRepository.create({
      tenantId,
      sessionId: session.id,
      trainingContentId: content.id,
      order: dto.order ?? 0,
      notes: dto.notes ?? null,
      customDurationMinutes: dto.customDurationMinutes ?? null,
    });

    return this.sessionContentsRepository.save(entity);
  }

  async createForSession(
    sessionId: string,
    dto: CreateSessionContentDto,
    actor: AuthenticatedUser,
  ) {
    if (dto.sessionId !== sessionId) {
      throw new BadRequestException('sessionId in body must match URL sessionId');
    }

    return this.create(dto, actor);
  }

  async findAll(actor: AuthenticatedUser) {
    if (actor.role === Role.SUPER_ADMIN) {
      return this.sessionContentsRepository.find({ order: { createdAt: 'DESC' } });
    }

    return this.sessionContentsRepository.find({
      where: { tenantId: actor.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const entity = await this.sessionContentsRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Session content not found');
    }

    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async findBySession(sessionId: string, actor: AuthenticatedUser) {
    const session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    this.assertTenantAccess(session.tenantId, actor);

    return this.sessionContentsRepository.find({
      where: { sessionId, tenantId: session.tenantId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateSessionContentDto, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    if (dto.sessionId) {
      await this.ensureSessionBelongsToTenant(dto.sessionId, entity.tenantId);
    }

    if (dto.trainingContentId) {
      await this.ensureContentBelongsToTenant(dto.trainingContentId, entity.tenantId);
    }

    Object.assign(entity, {
      sessionId: dto.sessionId ?? entity.sessionId,
      trainingContentId: dto.trainingContentId ?? entity.trainingContentId,
      order: dto.order ?? entity.order,
      notes: dto.notes ?? entity.notes,
      customDurationMinutes:
        dto.customDurationMinutes ?? entity.customDurationMinutes,
    });

    return this.sessionContentsRepository.save(entity);
  }

  async updateWithinSession(
    sessionId: string,
    id: string,
    dto: UpdateSessionContentDto,
    actor: AuthenticatedUser,
  ) {
    const entity = await this.findOne(id, actor);
    if (entity.sessionId !== sessionId) {
      throw new BadRequestException('Session content does not belong to this session');
    }

    if (dto.sessionId && dto.sessionId !== sessionId) {
      throw new BadRequestException('sessionId in body must match URL sessionId');
    }

    return this.update(id, { ...dto, sessionId }, actor);
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    await this.sessionContentsRepository.remove(entity);
    return { deleted: true };
  }

  async removeWithinSession(sessionId: string, id: string, actor: AuthenticatedUser) {
    const entity = await this.findOne(id, actor);
    if (entity.sessionId !== sessionId) {
      throw new BadRequestException('Session content does not belong to this session');
    }

    return this.remove(id, actor);
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

  private async ensureSessionBelongsToTenant(sessionId: string, tenantId: string) {
    const session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Training session not found');
    if (session.tenantId !== tenantId) {
      throw new BadRequestException(
        'Training session does not belong to the provided tenant',
      );
    }
    return session;
  }

  private async ensureContentBelongsToTenant(
    contentId: string,
    tenantId: string,
  ) {
    const content = await this.contentsRepository.findOne({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Training content not found');
    if (content.tenantId !== tenantId) {
      throw new BadRequestException(
        'Training content does not belong to the provided tenant',
      );
    }
    return content;
  }
}
