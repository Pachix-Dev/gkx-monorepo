import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API running message', () => {
      expect(appController.getRoot()).toEqual({
        success: true,
        message: 'API running',
        data: {
          service: 'goalkeeper-training-api',
          status: 'ok',
          version: '1.0.0',
          timestamp: expect.any(String) as string,
        },
      });
    });
  });

  describe('health', () => {
    it('should return health check message', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        uptime: expect.any(Number) as number,
        timestamp: expect.any(String) as string,
      });
    });
  });
});
