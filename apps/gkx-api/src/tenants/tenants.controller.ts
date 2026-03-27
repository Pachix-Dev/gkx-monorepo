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
  PublicTenantModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Tenants')
@ApiBearerAuth('jwt-auth')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear tenant' })
  @ApiTypedSuccessResponse({
    message: 'Tenant created successfully',
    status: 201,
    model: PublicTenantModel,
  })
  @ApiCommonErrorResponses()
  async create(@Body() dto: CreateTenantDto) {
    const data = await this.tenantsService.create(dto);
    return { success: true, message: 'Tenant created successfully', data };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Listar tenants' })
  @ApiTypedSuccessResponse({
    message: 'Tenants retrieved successfully',
    isArray: true,
    model: PublicTenantModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.tenantsService.findAll(user);
    return { success: true, message: 'Tenants retrieved successfully', data };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Obtener tenant por id' })
  @ApiUuidParam('id', 'Identificador del tenant')
  @ApiTypedSuccessResponse({
    message: 'Tenant retrieved successfully',
    model: PublicTenantModel,
  })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.tenantsService.findOne(id, user);
    return { success: true, message: 'Tenant retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Actualizar tenant' })
  @ApiUuidParam('id', 'Identificador del tenant')
  @ApiTypedSuccessResponse({
    message: 'Tenant updated successfully',
    model: PublicTenantModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.tenantsService.update(id, dto, user);
    return { success: true, message: 'Tenant updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar tenant' })
  @ApiUuidParam('id', 'Identificador del tenant')
  @ApiTypedSuccessResponse({
    message: 'Tenant deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.tenantsService.remove(id);
    return { success: true, message: 'Tenant deleted successfully', data };
  }
}
