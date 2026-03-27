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
  GoalkeeperModel,
  TeamModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Teams')
@ApiBearerAuth('jwt-auth')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Crear equipo' })
  @ApiTypedSuccessResponse({
    message: 'Team created successfully',
    status: 201,
    model: TeamModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.teamsService.create(dto, user);
    return { success: true, message: 'Team created successfully', data };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Listar equipos' })
  @ApiTypedSuccessResponse({
    message: 'Teams retrieved successfully',
    isArray: true,
    model: TeamModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.teamsService.findAll(user);
    return { success: true, message: 'Teams retrieved successfully', data };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener equipo por id' })
  @ApiUuidParam('id', 'Identificador del equipo')
  @ApiTypedSuccessResponse({
    message: 'Team retrieved successfully',
    model: TeamModel,
  })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.teamsService.findOne(id, user);
    return { success: true, message: 'Team retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Actualizar equipo' })
  @ApiUuidParam('id', 'Identificador del equipo')
  @ApiTypedSuccessResponse({
    message: 'Team updated successfully',
    model: TeamModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.teamsService.update(id, dto, user);
    return { success: true, message: 'Team updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Eliminar equipo' })
  @ApiUuidParam('id', 'Identificador del equipo')
  @ApiTypedSuccessResponse({
    message: 'Team deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.teamsService.remove(id, user);
    return { success: true, message: 'Team deleted successfully', data };
  }

  @Post(':id/goalkeepers/:goalkeeperId')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Asignar portero a equipo' })
  @ApiUuidParam('id', 'Identificador del equipo')
  @ApiUuidParam('goalkeeperId', 'Identificador del portero')
  @ApiTypedSuccessResponse({
    message: 'Goalkeeper assigned to team successfully',
    status: 201,
    model: GoalkeeperModel,
  })
  @ApiCommonErrorResponses()
  async assignGoalkeeper(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('goalkeeperId', ParseUUIDPipe) goalkeeperId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.teamsService.assignGoalkeeper(
      id,
      goalkeeperId,
      user,
    );
    return {
      success: true,
      message: 'Goalkeeper assigned to team successfully',
      data,
    };
  }
}
