import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { Role } from '../src/auth/roles.enum';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { TrainingSessionsController } from '../src/training-sessions/training-sessions.controller';
import { TrainingSessionsService } from '../src/training-sessions/training-sessions.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((response) => {
        const body = response.body as {
          success?: boolean;
          message?: string;
          data?: { service?: string; status?: string };
        };

        expect(body.success).toBe(true);
        expect(body.message).toBe('API running');
        expect(body.data?.service).toBe('goalkeeper-training-api');
        expect(body.data?.status).toBe('ok');
      });
  });
});

describe('TrainingSessionsController (e2e) - validation', () => {
  let app: INestApplication<App>;
  let jwtGuardSpy: jest.SpiedFunction<JwtAuthGuard['canActivate']>;
  let rolesGuardSpy: jest.SpiedFunction<RolesGuard['canActivate']>;
  const sessionsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    buildFieldSheetPdf: jest.fn(),
  };

  beforeEach(async () => {
    jwtGuardSpy = jest
      .spyOn(JwtAuthGuard.prototype, 'canActivate')
      .mockImplementation((context: ExecutionContext) => {
        const requestRef = context.switchToHttp().getRequest<{
          user?: { userId: string; tenantId: string; role: Role };
        }>();
        requestRef.user = {
          userId: 'user-id',
          tenantId: 'tenant-id',
          role: Role.USER,
        };
        return true;
      });

    rolesGuardSpy = jest
      .spyOn(RolesGuard.prototype, 'canActivate')
      .mockReturnValue(true);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TrainingSessionsController],
      providers: [
        { provide: TrainingSessionsService, useValue: sessionsServiceMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    jwtGuardSpy.mockRestore();
    rolesGuardSpy.mockRestore();
    jest.clearAllMocks();
    await app.close();
  });

  it('PATCH /api/training-sessions/:id should return 400 when trainingContentIds is empty', () => {
    const sessionId = '11111111-1111-4111-8111-111111111111';

    return request(app.getHttpServer())
      .patch(`/api/training-sessions/${sessionId}`)
      .send({ trainingContentIds: [] })
      .expect(400)
      .expect((response) => {
        const body = response.body as { message?: string[] | string };
        const messages = Array.isArray(body.message)
          ? body.message
          : [body.message ?? ''];

        expect(messages.some((msg) => msg.includes('trainingContentIds should not be empty'))).toBe(true);
        expect(sessionsServiceMock.update).not.toHaveBeenCalled();
      });
  });
});
