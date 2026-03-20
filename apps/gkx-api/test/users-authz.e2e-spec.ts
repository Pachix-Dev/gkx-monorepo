import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { Role } from '../src/auth/roles.enum';

const usersServiceMock = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('Users Authorization (e2e)', () => {
  let app: INestApplication<App>;
  let activeRole: Role;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        RolesGuard,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: Parameters<JwtAuthGuard['canActivate']>[0]) => {
          const request = context.switchToHttp().getRequest<{
            user?: { userId: string; tenantId: string; role: Role };
          }>();
          request.user = {
            userId: '11111111-1111-1111-1111-111111111111',
            tenantId: '22222222-2222-2222-2222-222222222222',
            role: activeRole,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects USER when trying to create users', async () => {
    activeRole = Role.USER;

    await request(app.getHttpServer())
      .post('/users')
      .send({
        tenantId: '33333333-3333-3333-3333-333333333333',
        fullName: 'Test User',
        email: 'test-user@gkx.com',
        password: 'StrongPass123',
        role: 'USER',
        status: 'ACTIVE',
      })
      .expect(403);

    expect(usersServiceMock.create).not.toHaveBeenCalled();
  });

  it('rejects USER when trying to list users', async () => {
    activeRole = Role.USER;

    await request(app.getHttpServer()).get('/users').expect(403);

    expect(usersServiceMock.findAll).not.toHaveBeenCalled();
  });

  it('rejects USER when trying to update another user', async () => {
    activeRole = Role.USER;

    await request(app.getHttpServer())
      .patch('/users/44444444-4444-4444-4444-444444444444')
      .send({ fullName: 'No permitido' })
      .expect(403);

    expect(usersServiceMock.update).not.toHaveBeenCalled();
  });

  it('rejects USER when trying to delete users', async () => {
    activeRole = Role.USER;

    await request(app.getHttpServer())
      .delete('/users/44444444-4444-4444-4444-444444444444')
      .expect(403);

    expect(usersServiceMock.remove).not.toHaveBeenCalled();
  });

  it('allows SUPER_ADMIN to create users', async () => {
    activeRole = Role.SUPER_ADMIN;
    usersServiceMock.create.mockResolvedValue({
      id: '44444444-4444-4444-4444-444444444444',
      tenantId: '33333333-3333-3333-3333-333333333333',
      fullName: 'Admin Created User',
      email: 'admin-created@gkx.com',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });

    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        tenantId: '33333333-3333-3333-3333-333333333333',
        fullName: 'Admin Created User',
        email: 'admin-created@gkx.com',
        password: 'StrongPass123',
        role: 'USER',
        status: 'ACTIVE',
      })
      .expect(201);

    expect((response.body as { success?: boolean }).success).toBe(true);
    expect(usersServiceMock.create).toHaveBeenCalledTimes(1);
  });
});
