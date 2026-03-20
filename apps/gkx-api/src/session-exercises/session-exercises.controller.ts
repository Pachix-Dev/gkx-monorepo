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

@Controller('session-exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Session Exercises')
@ApiBearerAuth('jwt-auth')
export class SessionExercisesController {
  constructor(private readonly sessionExercisesService: SessionExercisesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Crear relacion session-exercise' })
  @ApiTypedSuccessResponse({
    message: 'Session exercise created successfully',
    status: 201,
    model: SessionExerciseModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateSessionExerciseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionExercisesService.create(dto, user);
    return { success: true, message: 'Session exercise created successfully', data };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Listar session-exercises' })
  @ApiTypedSuccessResponse({
    message: 'Session exercises retrieved successfully',
    isArray: true,
    model: SessionExerciseModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.sessionExercisesService.findAll(user);
    return { success: true, message: 'Session exercises retrieved successfully', data };
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Obtener session-exercise por id' })
  @ApiUuidParam('id', 'Identificador de session-exercise')
  @ApiTypedSuccessResponse({
    message: 'Session exercise retrieved successfully',
    model: SessionExerciseModel,
  })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionExercisesService.findOne(id, user);
    return { success: true, message: 'Session exercise retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Actualizar session-exercise' })
  @ApiUuidParam('id', 'Identificador de session-exercise')
  @ApiTypedSuccessResponse({
    message: 'Session exercise updated successfully',
    model: SessionExerciseModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionExerciseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionExercisesService.update(id, dto, user);
    return { success: true, message: 'Session exercise updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Eliminar session-exercise' })
  @ApiUuidParam('id', 'Identificador de session-exercise')
  @ApiTypedSuccessResponse({
    message: 'Session exercise deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionExercisesService.remove(id, user);
    return { success: true, message: 'Session exercise deleted successfully', data };
  }
}
