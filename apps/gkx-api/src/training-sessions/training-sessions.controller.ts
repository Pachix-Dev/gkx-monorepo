import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCommonErrorResponses,
  ApiTypedSuccessResponse,
  ApiUuidParam,
} from '../common/swagger/openapi.decorators';
import {
  DeleteDataModel,
  TrainingSessionModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateTrainingSessionDto } from './dto/create-training-session.dto';
import { UpdateTrainingSessionDto } from './dto/update-training-session.dto';
import { TrainingSessionsService } from './training-sessions.service';

@Controller('training-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Training Sessions')
@ApiBearerAuth('jwt-auth')
export class TrainingSessionsController {
  constructor(private readonly sessionsService: TrainingSessionsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.COACH, Role.ASSISTANT_COACH)
  @ApiOperation({ summary: 'Crear sesion de entrenamiento' })
  @ApiTypedSuccessResponse({
    message: 'Training session created successfully',
    status: 201,
    model: TrainingSessionModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateTrainingSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionsService.create(dto, user);
    return { success: true, message: 'Training session created successfully', data };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.COACH,
    Role.ASSISTANT_COACH,
    Role.READONLY,
  )
  @ApiOperation({ summary: 'Listar sesiones de entrenamiento' })
  @ApiTypedSuccessResponse({
    message: 'Training sessions retrieved successfully',
    isArray: true,
    model: TrainingSessionModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.sessionsService.findAll(user);
    return { success: true, message: 'Training sessions retrieved successfully', data };
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.COACH,
    Role.ASSISTANT_COACH,
    Role.READONLY,
  )
  @ApiOperation({ summary: 'Obtener sesion por id' })
  @ApiUuidParam('id', 'Identificador de la sesion')
  @ApiTypedSuccessResponse({
    message: 'Training session retrieved successfully',
    model: TrainingSessionModel,
  })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionsService.findOne(id, user);
    return { success: true, message: 'Training session retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.COACH, Role.ASSISTANT_COACH)
  @ApiOperation({ summary: 'Actualizar sesion de entrenamiento' })
  @ApiUuidParam('id', 'Identificador de la sesion')
  @ApiTypedSuccessResponse({
    message: 'Training session updated successfully',
    model: TrainingSessionModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrainingSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionsService.update(id, dto, user);
    return { success: true, message: 'Training session updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Eliminar sesion de entrenamiento' })
  @ApiUuidParam('id', 'Identificador de la sesion')
  @ApiTypedSuccessResponse({
    message: 'Training session deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionsService.remove(id, user);
    return { success: true, message: 'Training session deleted successfully', data };
  }
}
