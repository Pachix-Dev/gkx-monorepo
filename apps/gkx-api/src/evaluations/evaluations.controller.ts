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
  EvaluationModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationsService } from './evaluations.service';

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Evaluations')
@ApiBearerAuth('jwt-auth')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Crear evaluacion tecnica' })
  @ApiTypedSuccessResponse({
    message: 'Evaluation created successfully',
    status: 201,
    model: EvaluationModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.evaluationsService.create(dto, user);
    return { success: true, message: 'Evaluation created successfully', data };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Listar evaluaciones' })
  @ApiTypedSuccessResponse({
    message: 'Evaluations retrieved successfully',
    isArray: true,
    model: EvaluationModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.evaluationsService.findAll(user);
    return { success: true, message: 'Evaluations retrieved successfully', data };
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Obtener evaluacion por id' })
  @ApiUuidParam('id', 'Identificador de la evaluacion')
  @ApiTypedSuccessResponse({ message: 'Evaluation retrieved successfully', model: EvaluationModel })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.evaluationsService.findOne(id, user);
    return { success: true, message: 'Evaluation retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Actualizar evaluacion tecnica' })
  @ApiUuidParam('id', 'Identificador de la evaluacion')
  @ApiTypedSuccessResponse({ message: 'Evaluation updated successfully', model: EvaluationModel })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEvaluationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.evaluationsService.update(id, dto, user);
    return { success: true, message: 'Evaluation updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Eliminar evaluacion tecnica' })
  @ApiUuidParam('id', 'Identificador de la evaluacion')
  @ApiTypedSuccessResponse({ message: 'Evaluation deleted successfully', model: DeleteDataModel })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.evaluationsService.remove(id, user);
    return { success: true, message: 'Evaluation deleted successfully', data };
  }
}
