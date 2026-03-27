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
  TrainingLineModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateTrainingLineDto } from './dto/create-training-line.dto';
import { UpdateTrainingLineDto } from './dto/update-training-line.dto';
import { TrainingLinesService } from './training-lines.service';

@Controller('training-lines')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Training Lines')
@ApiBearerAuth('jwt-auth')
export class TrainingLinesController {
  constructor(private readonly trainingLinesService: TrainingLinesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Crear linea de entrenamiento' })
  @ApiTypedSuccessResponse({
    message: 'Training line created successfully',
    status: 201,
    model: TrainingLineModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateTrainingLineDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.trainingLinesService.create(dto, user);
    return {
      success: true,
      message: 'Training line created successfully',
      data,
    };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Listar lineas de entrenamiento' })
  @ApiTypedSuccessResponse({
    message: 'Training lines retrieved successfully',
    isArray: true,
    model: TrainingLineModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.trainingLinesService.findAll(user);
    return {
      success: true,
      message: 'Training lines retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener linea de entrenamiento por id' })
  @ApiUuidParam('id', 'Identificador de la linea de entrenamiento')
  @ApiTypedSuccessResponse({
    message: 'Training line retrieved successfully',
    model: TrainingLineModel,
  })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.trainingLinesService.findOne(id, user);
    return {
      success: true,
      message: 'Training line retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Actualizar linea de entrenamiento' })
  @ApiUuidParam('id', 'Identificador de la linea de entrenamiento')
  @ApiTypedSuccessResponse({
    message: 'Training line updated successfully',
    model: TrainingLineModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrainingLineDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.trainingLinesService.update(id, dto, user);
    return {
      success: true,
      message: 'Training line updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Eliminar linea de entrenamiento' })
  @ApiUuidParam('id', 'Identificador de la linea de entrenamiento')
  @ApiTypedSuccessResponse({
    message: 'Training line deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.trainingLinesService.remove(id, user);
    return {
      success: true,
      message: 'Training line deleted successfully',
      data,
    };
  }
}
