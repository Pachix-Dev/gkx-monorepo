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
  PublicUserModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Users')
@ApiBearerAuth('jwt-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiTypedSuccessResponse({
    message: 'User created successfully',
    status: 201,
    model: PublicUserModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.usersService.create(dto, user);
    return { success: true, message: 'User created successfully', data };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiTypedSuccessResponse({
    message: 'Users retrieved successfully',
    isArray: true,
    model: PublicUserModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.usersService.findAll(user);
    return { success: true, message: 'Users retrieved successfully', data };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obtener usuario por id' })
  @ApiUuidParam('id', 'Identificador del usuario')
  @ApiTypedSuccessResponse({
    message: 'User retrieved successfully',
    model: PublicUserModel,
  })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.usersService.findOne(id, user);
    return { success: true, message: 'User retrieved successfully', data };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiUuidParam('id', 'Identificador del usuario')
  @ApiTypedSuccessResponse({
    message: 'User updated successfully',
    model: PublicUserModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.usersService.update(id, dto, user);
    return { success: true, message: 'User updated successfully', data };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiUuidParam('id', 'Identificador del usuario')
  @ApiTypedSuccessResponse({
    message: 'User deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.usersService.remove(id, user);
    return { success: true, message: 'User deleted successfully', data };
  }
}
