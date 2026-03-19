import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';

@ApiTags('system')
@Controller()
export class AppController {
  @Get()
  @ApiExcludeEndpoint()
  getRoot() {
    return {
      success: true,
      message: 'API running',
      data: {
        service: 'goalkeeper-training-api',
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
