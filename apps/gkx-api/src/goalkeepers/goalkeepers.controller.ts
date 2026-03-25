import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiCommonErrorResponses,
  ApiTypedSuccessResponse,
  ApiUuidParam,
} from '../common/swagger/openapi.decorators';
import {
  DeleteDataModel,
  EvaluationModel,
  GoalkeeperMetricsModel,
  GoalkeeperModel,
  GoalkeeperProgressModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateGoalkeeperDto } from './dto/create-goalkeeper.dto';
import { UpdateGoalkeeperDto } from './dto/update-goalkeeper.dto';
import { GoalkeepersService } from './goalkeepers.service';

interface UploadedGoalkeeperAvatar {
  mimetype: string;
  buffer: Buffer;
  originalname: string;
}

@Controller('goalkeepers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Goalkeepers')
@ApiBearerAuth('jwt-auth')
export class GoalkeepersController {
  constructor(private readonly goalkeepersService: GoalkeepersService) {}

  @Post()
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Crear perfil de portero' })
  @ApiTypedSuccessResponse({
    message: 'Goalkeeper profile created successfully',
    status: 201,
    model: GoalkeeperModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateGoalkeeperDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.goalkeepersService.create(dto, user);
    return { success: true, message: 'Goalkeeper profile created successfully', data };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Listar perfiles de portero' })
  @ApiTypedSuccessResponse({
    message: 'Goalkeeper profiles retrieved successfully',
    isArray: true,
    model: GoalkeeperModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.goalkeepersService.findAll(user);
    return { success: true, message: 'Goalkeeper profiles retrieved successfully', data };
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Obtener perfil de portero por id' })
  @ApiUuidParam('id', 'Identificador del portero')
  @ApiTypedSuccessResponse({
    message: 'Goalkeeper profile retrieved successfully',
    model: GoalkeeperModel,
  })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.goalkeepersService.findOne(id, user);
    return { success: true, message: 'Goalkeeper profile retrieved successfully', data };
  }

  @Get(':id/progress')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Obtener progreso agregado del portero' })
  @ApiUuidParam('id', 'Identificador del portero')
  @ApiTypedSuccessResponse({
    message: 'Goalkeeper progress retrieved successfully',
    model: GoalkeeperProgressModel,
  })
  @ApiCommonErrorResponses()
  async getProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.goalkeepersService.getProgress(id, user);
    return { success: true, message: 'Goalkeeper progress retrieved successfully', data };
  }

  @Get(':id/evaluations')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Listar evaluaciones del portero' })
  @ApiUuidParam('id', 'Identificador del portero')
  @ApiTypedSuccessResponse({
    message: 'Goalkeeper evaluations retrieved successfully',
    isArray: true,
    model: EvaluationModel,
  })
  @ApiCommonErrorResponses()
  async getEvaluations(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.goalkeepersService.getEvaluations(id, user);
    return { success: true, message: 'Goalkeeper evaluations retrieved successfully', data };
  }

  @Get(':id/metrics')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Obtener metricas del portero' })
  @ApiUuidParam('id', 'Identificador del portero')
  @ApiTypedSuccessResponse({
    message: 'Goalkeeper metrics retrieved successfully',
    model: GoalkeeperMetricsModel,
  })
  @ApiCommonErrorResponses()
  async getMetrics(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.goalkeepersService.getMetrics(id, user);
    return { success: true, message: 'Goalkeeper metrics retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Actualizar perfil de portero' })
  @ApiUuidParam('id', 'Identificador del portero')
  @ApiTypedSuccessResponse({
    message: 'Goalkeeper profile updated successfully',
    model: GoalkeeperModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGoalkeeperDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.goalkeepersService.update(id, dto, user);
    return { success: true, message: 'Goalkeeper profile updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Eliminar perfil de portero' })
  @ApiUuidParam('id', 'Identificador del portero')
  @ApiTypedSuccessResponse({
    message: 'Goalkeeper profile deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.goalkeepersService.remove(id, user);
    return { success: true, message: 'Goalkeeper profile deleted successfully', data };
  }

  @Post(':id/avatar')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: Number(process.env.GOALKEEPER_AVATAR_MAX_FILE_SIZE ?? 5_000_000),
      },
      fileFilter: (_req, file, callback) => {
        const allowed = ['image/webp', 'image/png', 'image/jpeg'];
        callback(null, allowed.includes(file.mimetype));
      },
    }),
  )
  @ApiOperation({ summary: 'Subir o actualizar avatar del portero' })
  @ApiUuidParam('id', 'Identificador del portero')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiTypedSuccessResponse({
    message: 'Avatar uploaded successfully',
    model: GoalkeeperModel,
  })
  @ApiCommonErrorResponses()
  async uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedGoalkeeperAvatar | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Archivo imagen requerido (formatos: webp, png, jpeg)',
      );
    }
    const data = await this.goalkeepersService.uploadAvatar(id, file, user);
    return { success: true, message: 'Avatar uploaded successfully', data };
  }
}
