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
import { TrainingContentModel } from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { TrainingContentsService } from './training-contents.service';

@Controller('training-lines/:id/contents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Training Contents')
@ApiBearerAuth('jwt-auth')
export class TrainingContentsNestedController {
  constructor(private readonly contentsService: TrainingContentsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Listar contenidos por linea de entrenamiento' })
  @ApiUuidParam('id', 'Identificador de la linea de entrenamiento')
  @ApiTypedSuccessResponse({
    message: 'Training contents retrieved successfully',
    isArray: true,
    model: TrainingContentModel,
  })
  @ApiCommonErrorResponses()
  async findByTrainingLine(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.contentsService.findAll(user, {
      trainingLineId: id,
    });
    return {
      success: true,
      message: 'Training contents retrieved successfully',
      data,
    };
  }
}
