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
  AttendanceModel,
  DeleteDataModel,
} from '../common/swagger/response-models';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceBulkDto } from './dto/create-attendance-bulk.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Attendance')
@ApiBearerAuth('jwt-auth')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Registrar asistencia individual' })
  @ApiTypedSuccessResponse({
    message: 'Attendance created successfully',
    status: 201,
    model: AttendanceModel,
  })
  @ApiCommonErrorResponses()
  async create(
    @Body() dto: CreateAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data: unknown = await this.attendanceService.create(dto, user);
    return {
      success: true,
      message: 'Attendance created successfully',
      data,
    };
  }

  @Post('bulk')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Registrar asistencia masiva por sesion' })
  @ApiTypedSuccessResponse({
    message: 'Attendance bulk upsert successful',
    status: 201,
    isArray: true,
    model: AttendanceModel,
  })
  @ApiCommonErrorResponses()
  async createBulk(
    @Body() dto: CreateAttendanceBulkDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data: unknown = await this.attendanceService.createBulk(dto, user);
    return {
      success: true,
      message: 'Attendance bulk upsert successful',
      data,
    };
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Listar asistencias' })
  @ApiTypedSuccessResponse({
    message: 'Attendance records retrieved successfully',
    isArray: true,
    model: AttendanceModel,
  })
  @ApiCommonErrorResponses()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    const data: unknown = await this.attendanceService.findAll(user);
    return {
      success: true,
      message: 'Attendance records retrieved successfully',
      data,
    };
  }

  @Get('session/:trainingSessionId')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Listar asistencias por sesion' })
  @ApiUuidParam('trainingSessionId', 'Identificador de la sesion')
  @ApiTypedSuccessResponse({
    message: 'Session attendance retrieved successfully',
    isArray: true,
    model: AttendanceModel,
  })
  @ApiCommonErrorResponses()
  async findBySession(
    @Param('trainingSessionId', ParseUUIDPipe) trainingSessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data: unknown = await this.attendanceService.findBySession(
      trainingSessionId,
      user,
    );
    return {
      success: true,
      message: 'Session attendance retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Obtener asistencia por id' })
  @ApiUuidParam('id', 'Identificador del registro de asistencia')
  @ApiTypedSuccessResponse({
    message: 'Attendance record retrieved successfully',
    model: AttendanceModel,
  })
  @ApiCommonErrorResponses()
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data: unknown = await this.attendanceService.findOne(id, user);
    return {
      success: true,
      message: 'Attendance record retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Actualizar asistencia' })
  @ApiUuidParam('id', 'Identificador del registro de asistencia')
  @ApiTypedSuccessResponse({
    message: 'Attendance record updated successfully',
    model: AttendanceModel,
  })
  @ApiCommonErrorResponses()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data: unknown = await this.attendanceService.update(id, dto, user);
    return {
      success: true,
      message: 'Attendance record updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Eliminar asistencia' })
  @ApiUuidParam('id', 'Identificador del registro de asistencia')
  @ApiTypedSuccessResponse({
    message: 'Attendance record deleted successfully',
    model: DeleteDataModel,
  })
  @ApiCommonErrorResponses()
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data: unknown = await this.attendanceService.remove(id, user);
    return {
      success: true,
      message: 'Attendance record deleted successfully',
      data,
    };
  }
}
