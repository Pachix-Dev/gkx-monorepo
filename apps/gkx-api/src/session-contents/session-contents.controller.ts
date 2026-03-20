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
  SessionContentModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateSessionContentDto } from './dto/create-session-content.dto';
import { UpdateSessionContentDto } from './dto/update-session-content.dto';
import { SessionContentsService } from './session-contents.service';

@Controller('session-contents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Session Contents')
@ApiBearerAuth('jwt-auth')
export class SessionContentsController {
  constructor(private readonly sessionContentsService: SessionContentsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Crear relacion session-content' })
  @ApiTypedSuccessResponse({
    message: 'Session content created successfully',
    status: 201,
    model: SessionContentModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateSessionContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionContentsService.create(dto, user);
    return { success: true, message: 'Session content created successfully', data };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Listar session-contents' })
  @ApiTypedSuccessResponse({
    message: 'Session contents retrieved successfully',
    isArray: true,
    model: SessionContentModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.sessionContentsService.findAll(user);
    return { success: true, message: 'Session contents retrieved successfully', data };
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Obtener session-content por id' })
  @ApiUuidParam('id', 'Identificador de session-content')
  @ApiTypedSuccessResponse({
    message: 'Session content retrieved successfully',
    model: SessionContentModel,
  })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionContentsService.findOne(id, user);
    return { success: true, message: 'Session content retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Actualizar session-content' })
  @ApiUuidParam('id', 'Identificador de session-content')
  @ApiTypedSuccessResponse({
    message: 'Session content updated successfully',
    model: SessionContentModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSessionContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionContentsService.update(id, dto, user);
    return { success: true, message: 'Session content updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Eliminar session-content' })
  @ApiUuidParam('id', 'Identificador de session-content')
  @ApiTypedSuccessResponse({
    message: 'Session content deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionContentsService.remove(id, user);
    return { success: true, message: 'Session content deleted successfully', data };
  }
}
