import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCommonErrorResponses,
  ApiTypedSuccessResponse,
  ApiUuidParam,
} from '../common/swagger/openapi.decorators';
import { ExerciseModel } from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { ExercisesService } from './exercises.service';

@Controller('training-contents/:id/exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Exercises')
@ApiBearerAuth('jwt-auth')
export class ExercisesNestedController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Listar ejercicios por contenido de entrenamiento' })
  @ApiUuidParam('id', 'Identificador del contenido de entrenamiento')
  @ApiTypedSuccessResponse({
    message: 'Exercises retrieved successfully',
    isArray: true,
    model: ExerciseModel,
  })
  @ApiCommonErrorResponses()
  async findByTrainingContent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.exercisesService.findAll(user, { trainingContentId: id });
    return { success: true, message: 'Exercises retrieved successfully', data };
  }
}
