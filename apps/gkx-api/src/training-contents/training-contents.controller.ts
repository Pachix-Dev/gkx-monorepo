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
import {
  DeleteDataModel,
  TrainingContentModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateTrainingContentDto } from './dto/create-training-content.dto';
import { UpdateTrainingContentDto } from './dto/update-training-content.dto';
import { TrainingContentsService } from './training-contents.service';

@Controller('training-contents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Training Contents')
@ApiBearerAuth('jwt-auth')
export class TrainingContentsController {
  constructor(private readonly contentsService: TrainingContentsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.COACH, Role.ASSISTANT_COACH)
  @ApiOperation({ summary: 'Crear contenido de entrenamiento' })
  @ApiTypedSuccessResponse({
    message: 'Training content created successfully',
    status: 201,
    model: TrainingContentModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateTrainingContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.contentsService.create(dto, user);
    return { success: true, message: 'Training content created successfully', data };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.COACH,
    Role.ASSISTANT_COACH,
    Role.READONLY,
  )
  @ApiOperation({ summary: 'Listar contenidos de entrenamiento' })
  @ApiQuery({ name: 'trainingLineId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiTypedSuccessResponse({
    message: 'Training contents retrieved successfully',
    isArray: true,
    model: TrainingContentModel,
  })
  @ApiCommonErrorResponses()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('trainingLineId') trainingLineId?: string,
    @Query('level') level?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.contentsService.findAll(user, {
      trainingLineId,
      level,
      search,
    });
    return { success: true, message: 'Training contents retrieved successfully', data };
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.COACH,
    Role.ASSISTANT_COACH,
    Role.READONLY,
  )
  @ApiOperation({ summary: 'Obtener contenido por id' })
  @ApiUuidParam('id', 'Identificador del contenido')
  @ApiTypedSuccessResponse({
    message: 'Training content retrieved successfully',
    model: TrainingContentModel,
  })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.contentsService.findOne(id, user);
    return { success: true, message: 'Training content retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.COACH, Role.ASSISTANT_COACH)
  @ApiOperation({ summary: 'Actualizar contenido de entrenamiento' })
  @ApiUuidParam('id', 'Identificador del contenido')
  @ApiTypedSuccessResponse({
    message: 'Training content updated successfully',
    model: TrainingContentModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrainingContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.contentsService.update(id, dto, user);
    return { success: true, message: 'Training content updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Eliminar contenido de entrenamiento' })
  @ApiUuidParam('id', 'Identificador del contenido')
  @ApiTypedSuccessResponse({
    message: 'Training content deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.contentsService.remove(id, user);
    return { success: true, message: 'Training content deleted successfully', data };
  }
}
