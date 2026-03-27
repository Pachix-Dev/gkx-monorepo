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
import { AttendanceEntity, AttendanceStatus } from './attendance.entity';
import { CreateAttendanceBulkDto } from './dto/create-attendance-bulk.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(TenantEntity)
    private readonly tenantsRepository: Repository<TenantEntity>,
    @InjectRepository(TrainingSessionEntity)
    private readonly sessionsRepository: Repository<TrainingSessionEntity>,
    @InjectRepository(GoalkeeperEntity)
    private readonly goalkeepersRepository: Repository<GoalkeeperEntity>,
  ) {}

  async create(
    dto: CreateAttendanceDto,
    actor: AuthenticatedUser,
  ): Promise<AttendanceEntity> {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    await this.ensureTenantExists(tenantId);
    await this.ensureSessionBelongsToTenant(dto.trainingSessionId, tenantId);
    await this.ensureGoalkeeperBelongsToTenant(dto.goalkeeperId, tenantId);

    const entity = this.attendanceRepository.create({
      tenantId,
      trainingSessionId: dto.trainingSessionId,
      goalkeeperId: dto.goalkeeperId,
      status: dto.status ?? AttendanceStatus.PRESENT,
      notes: dto.notes ?? null,
      recordedByUserId: actor.userId,
      recordedAt: new Date(),
    });

    return this.attendanceRepository.save(entity);
  }

  async createBulk(
    dto: CreateAttendanceBulkDto,
    actor: AuthenticatedUser,
  ): Promise<AttendanceEntity[]> {
    const tenantId = this.resolveTenantIdForCreate(dto.tenantId, actor);
    await this.ensureTenantExists(tenantId);
    await this.ensureSessionBelongsToTenant(dto.trainingSessionId, tenantId);

    const results: AttendanceEntity[] = [];
    for (const item of dto.items) {
      await this.ensureGoalkeeperBelongsToTenant(item.goalkeeperId, tenantId);

      let entity = await this.attendanceRepository.findOne({
        where: {
          tenantId,
          trainingSessionId: dto.trainingSessionId,
          goalkeeperId: item.goalkeeperId,
        },
      });

      if (!entity) {
        entity = this.attendanceRepository.create({
          tenantId,
          trainingSessionId: dto.trainingSessionId,
          goalkeeperId: item.goalkeeperId,
          status: item.status,
          notes: item.notes ?? null,
          recordedByUserId: actor.userId,
          recordedAt: new Date(),
        });
      } else {
        entity.status = item.status;
        entity.notes = item.notes ?? null;
        entity.recordedByUserId = actor.userId;
        entity.recordedAt = new Date();
      }

      results.push(await this.attendanceRepository.save(entity));
    }

    return results;
  }

  async findAll(actor: AuthenticatedUser): Promise<AttendanceEntity[]> {
    if (actor.role === Role.SUPER_ADMIN) {
      return this.attendanceRepository.find({ order: { createdAt: 'DESC' } });
    }

    return this.attendanceRepository.find({
      where: { tenantId: actor.tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySession(
    sessionId: string,
    actor: AuthenticatedUser,
  ): Promise<AttendanceEntity[]> {
    const session = await this.sessionsRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Training session not found');
    }

    this.assertTenantAccess(session.tenantId, actor);

    return this.attendanceRepository.find({
      where: {
        tenantId: session.tenantId,
        trainingSessionId: sessionId,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<AttendanceEntity> {
    const entity = await this.attendanceRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Attendance record not found');
    this.assertTenantAccess(entity.tenantId, actor);
    return entity;
  }

  async update(
    id: string,
    dto: UpdateAttendanceDto,
    actor: AuthenticatedUser,
  ): Promise<AttendanceEntity> {
    const entity = await this.findOne(id, actor);

    if (dto.tenantId && dto.tenantId !== entity.tenantId) {
      throw new BadRequestException('Changing tenantId is not allowed');
    }

    if (dto.trainingSessionId) {
      await this.ensureSessionBelongsToTenant(
        dto.trainingSessionId,
        entity.tenantId,
      );
    }

    if (dto.goalkeeperId) {
      await this.ensureGoalkeeperBelongsToTenant(
        dto.goalkeeperId,
        entity.tenantId,
      );
    }

    Object.assign(entity, {
      trainingSessionId: dto.trainingSessionId ?? entity.trainingSessionId,
      goalkeeperId: dto.goalkeeperId ?? entity.goalkeeperId,
      status: dto.status ?? entity.status,
      notes: dto.notes ?? entity.notes,
      recordedByUserId: actor.userId,
      recordedAt: new Date(),
    });

    return this.attendanceRepository.save(entity);
  }

  async remove(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<{ deleted: true }> {
    const entity = await this.findOne(id, actor);
    await this.attendanceRepository.remove(entity);
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
}
