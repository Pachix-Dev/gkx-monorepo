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
  SessionExerciseModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateSessionExerciseDto } from './dto/create-session-exercise.dto';
import { UpdateSessionExerciseDto } from './dto/update-session-exercise.dto';
import { SessionExercisesService } from './session-exercises.service';

@Controller('training-sessions/:sessionId/exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Session Exercises')
@ApiBearerAuth('jwt-auth')
export class SessionExercisesNestedController {
  constructor(private readonly sessionExercisesService: SessionExercisesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Agregar ejercicio a una sesion' })
  @ApiUuidParam('sessionId', 'Identificador de la sesion')
  @ApiTypedSuccessResponse({
    message: 'Session exercise created successfully',
    status: 201,
    model: SessionExerciseModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: CreateSessionExerciseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionExercisesService.createForSession(
      sessionId,
      dto,
      user,
    );
    return { success: true, message: 'Session exercise created successfully', data };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Listar ejercicios de una sesion' })
  @ApiUuidParam('sessionId', 'Identificador de la sesion')
  @ApiTypedSuccessResponse({
    message: 'Session exercises retrieved successfully',
    isArray: true,
    model: SessionExerciseModel,
  })
  @ApiCommonErrorResponses()
  async findBySession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionExercisesService.findBySession(sessionId, user);
    return { success: true, message: 'Session exercises retrieved successfully', data };
  }

  @Patch(':sessionExerciseId')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Actualizar ejercicio de una sesion' })
  @ApiUuidParam('sessionId', 'Identificador de la sesion')
  @ApiUuidParam('sessionExerciseId', 'Identificador de session-exercise')
  @ApiTypedSuccessResponse({
    message: 'Session exercise updated successfully',
    model: SessionExerciseModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('sessionExerciseId', ParseUUIDPipe) sessionExerciseId: string,
    @Body() dto: UpdateSessionExerciseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionExercisesService.updateWithinSession(
      sessionId,
      sessionExerciseId,
      dto,
      user,
    );
    return { success: true, message: 'Session exercise updated successfully', data };
  }

  @Delete(':sessionExerciseId')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Eliminar ejercicio de una sesion' })
  @ApiUuidParam('sessionId', 'Identificador de la sesion')
  @ApiUuidParam('sessionExerciseId', 'Identificador de session-exercise')
  @ApiTypedSuccessResponse({
    message: 'Session exercise deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('sessionExerciseId', ParseUUIDPipe) sessionExerciseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionExercisesService.removeWithinSession(
      sessionId,
      sessionExerciseId,
      user,
    );
    return { success: true, message: 'Session exercise deleted successfully', data };
  }
}
