import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import {
  ApiCommonErrorResponses,
  ApiUuidParam,
} from '../common/swagger/openapi.decorators';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('goalkeeper/:id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="goalkeeper-report.pdf"')
  @ApiOperation({ summary: 'Generate goalkeeper performance report PDF' })
  @ApiUuidParam('id', 'Goalkeeper UUID')
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  @ApiCommonErrorResponses()
  async goalkeeperReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const pdfBytes = await this.reportsService.generateGoalkeeperReport(
      id,
      from,
      to,
      actor,
    );
    return new StreamableFile(Buffer.from(pdfBytes));
  }

  @Get('team/:id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="team-report.pdf"')
  @ApiOperation({ summary: 'Generate team season summary report PDF' })
  @ApiUuidParam('id', 'Team UUID')
  @ApiQuery({ name: 'from', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-12-31' })
  @ApiCommonErrorResponses()
  async teamReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const pdfBytes = await this.reportsService.generateTeamReport(
      id,
      from,
      to,
      actor,
    );
    return new StreamableFile(Buffer.from(pdfBytes));
  }

  @Get('session/:id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="session-report.pdf"')
  @ApiOperation({ summary: 'Generate training session detail report PDF' })
  @ApiUuidParam('id', 'Training session UUID')
  @ApiCommonErrorResponses()
  async sessionReport(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const pdfBytes = await this.reportsService.generateSessionReport(id, actor);
    return new StreamableFile(Buffer.from(pdfBytes));
  }
}
