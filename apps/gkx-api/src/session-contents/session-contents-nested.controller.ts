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

@Controller('training-sessions/:sessionId/contents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Session Contents')
@ApiBearerAuth('jwt-auth')
export class SessionContentsNestedController {
  constructor(private readonly sessionContentsService: SessionContentsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.COACH, Role.ASSISTANT_COACH)
  @ApiOperation({ summary: 'Agregar contenido a una sesion' })
  @ApiUuidParam('sessionId', 'Identificador de la sesion')
  @ApiTypedSuccessResponse({
    message: 'Session content created successfully',
    status: 201,
    model: SessionContentModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: CreateSessionContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionContentsService.createForSession(
      sessionId,
      dto,
      user,
    );
    return { success: true, message: 'Session content created successfully', data };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.TENANT_ADMIN,
    Role.COACH,
    Role.ASSISTANT_COACH,
    Role.READONLY,
  )
  @ApiOperation({ summary: 'Listar contenidos de una sesion' })
  @ApiUuidParam('sessionId', 'Identificador de la sesion')
  @ApiTypedSuccessResponse({
    message: 'Session contents retrieved successfully',
    isArray: true,
    model: SessionContentModel,
  })
  @ApiCommonErrorResponses()
  async findBySession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionContentsService.findBySession(sessionId, user);
    return { success: true, message: 'Session contents retrieved successfully', data };
  }

  @Patch(':sessionContentId')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN, Role.COACH, Role.ASSISTANT_COACH)
  @ApiOperation({ summary: 'Actualizar contenido de una sesion' })
  @ApiUuidParam('sessionId', 'Identificador de la sesion')
  @ApiUuidParam('sessionContentId', 'Identificador de session-content')
  @ApiTypedSuccessResponse({
    message: 'Session content updated successfully',
    model: SessionContentModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('sessionContentId', ParseUUIDPipe) sessionContentId: string,
    @Body() dto: UpdateSessionContentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionContentsService.updateWithinSession(
      sessionId,
      sessionContentId,
      dto,
      user,
    );
    return { success: true, message: 'Session content updated successfully', data };
  }

  @Delete(':sessionContentId')
  @Roles(Role.SUPER_ADMIN, Role.TENANT_ADMIN)
  @ApiOperation({ summary: 'Eliminar contenido de una sesion' })
  @ApiUuidParam('sessionId', 'Identificador de la sesion')
  @ApiUuidParam('sessionContentId', 'Identificador de session-content')
  @ApiTypedSuccessResponse({
    message: 'Session content deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('sessionContentId', ParseUUIDPipe) sessionContentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.sessionContentsService.removeWithinSession(
      sessionId,
      sessionContentId,
      user,
    );
    return { success: true, message: 'Session content deleted successfully', data };
  }
}
