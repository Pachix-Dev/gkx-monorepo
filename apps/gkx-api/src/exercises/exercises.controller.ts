import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiCommonErrorResponses,
  ApiTypedSuccessResponse,
  ApiUuidParam,
} from '../common/swagger/openapi.decorators';
import { DeleteDataModel, ExerciseModel } from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExercisesService } from './exercises.service';

@Controller('exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Exercises')
@ApiBearerAuth('jwt-auth')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.COACH, Role.ASSISTANT_COACH)
  @ApiOperation({ summary: 'Crear ejercicio' })
  @ApiTypedSuccessResponse({
    message: 'Exercise created successfully',
    status: 201,
    model: ExerciseModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateExerciseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.exercisesService.create(dto, user);
    return { success: true, message: 'Exercise created successfully', data };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.COACH,
    Role.ASSISTANT_COACH,
    Role.READONLY,
  )
  @ApiOperation({ summary: 'Listar ejercicios' })
  @ApiQuery({ name: 'trainingContentId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'difficulty', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiTypedSuccessResponse({
    message: 'Exercises retrieved successfully',
    isArray: true,
    model: ExerciseModel,
  })
  @ApiCommonErrorResponses()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('trainingContentId') trainingContentId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.exercisesService.findAll(user, {
      trainingContentId,
      difficulty,
      search,
    });
    return { success: true, message: 'Exercises retrieved successfully', data };
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.COACH,
    Role.ASSISTANT_COACH,
    Role.READONLY,
  )
  @ApiOperation({ summary: 'Obtener ejercicio por id' })
  @ApiUuidParam('id', 'Identificador del ejercicio')
  @ApiTypedSuccessResponse({ message: 'Exercise retrieved successfully', model: ExerciseModel })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.exercisesService.findOne(id, user);
    return { success: true, message: 'Exercise retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.COACH, Role.ASSISTANT_COACH)
  @ApiOperation({ summary: 'Actualizar ejercicio' })
  @ApiUuidParam('id', 'Identificador del ejercicio')
  @ApiTypedSuccessResponse({ message: 'Exercise updated successfully', model: ExerciseModel })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExerciseDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.exercisesService.update(id, dto, user);
    return { success: true, message: 'Exercise updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Eliminar ejercicio' })
  @ApiUuidParam('id', 'Identificador del ejercicio')
  @ApiTypedSuccessResponse({ message: 'Exercise deleted successfully', model: DeleteDataModel })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.exercisesService.remove(id, user);
    return { success: true, message: 'Exercise deleted successfully', data };
  }
}
