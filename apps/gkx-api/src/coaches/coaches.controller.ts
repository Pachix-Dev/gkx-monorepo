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
import { CoachModel, DeleteDataModel } from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CoachesService } from './coaches.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

@Controller('coaches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Coaches')
@ApiBearerAuth('jwt-auth')
export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Crear perfil de coach' })
  @ApiTypedSuccessResponse({
    message: 'Coach profile created successfully',
    status: 201,
    model: CoachModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateCoachDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.coachesService.create(dto, user);
    return { success: true, message: 'Coach profile created successfully', data };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.COACH,
    Role.ASSISTANT_COACH,
    Role.READONLY,
  )
  @ApiOperation({ summary: 'Listar perfiles de coach' })
  @ApiTypedSuccessResponse({
    message: 'Coach profiles retrieved successfully',
    isArray: true,
    model: CoachModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.coachesService.findAll(user);
    return { success: true, message: 'Coach profiles retrieved successfully', data };
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.COACH,
    Role.ASSISTANT_COACH,
    Role.READONLY,
  )
  @ApiOperation({ summary: 'Obtener perfil de coach por id' })
  @ApiUuidParam('id', 'Identificador del coach')
  @ApiTypedSuccessResponse({ message: 'Coach profile retrieved successfully', model: CoachModel })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.coachesService.findOne(id, user);
    return { success: true, message: 'Coach profile retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Actualizar perfil de coach' })
  @ApiUuidParam('id', 'Identificador del coach')
  @ApiTypedSuccessResponse({ message: 'Coach profile updated successfully', model: CoachModel })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCoachDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.coachesService.update(id, dto, user);
    return { success: true, message: 'Coach profile updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Eliminar perfil de coach' })
  @ApiUuidParam('id', 'Identificador del coach')
  @ApiTypedSuccessResponse({ message: 'Coach profile deleted successfully', model: DeleteDataModel })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.coachesService.remove(id, user);
    return { success: true, message: 'Coach profile deleted successfully', data };
  }
}
