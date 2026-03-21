import {
  BadRequestException,
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiCommonErrorResponses,
  ApiTypedSuccessResponse,
  ApiUuidParam,
} from '../common/swagger/openapi.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Role } from '../auth/roles.enum';
import { UpdateTacticalDesignDto } from './dto/update-tactical-design.dto';
import { TacticalDesignResponseDto } from './dto/tactical-design-response.dto';
import { ExercisesService } from './exercises.service';

interface UploadedTacticalPreview {
  mimetype: string;
  buffer: Buffer;
}

@Controller('exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Exercises - Tactical Design')
@ApiBearerAuth('jwt-auth')
export class ExercisesTacticalController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get(':id/tactical')
  @Roles(
    Role.SUPER_ADMIN, Role.USER,
  )
  @ApiOperation({ summary: 'Obtener diseño táctico del ejercicio' })
  @ApiUuidParam('id', 'Identificador del ejercicio')
  @ApiTypedSuccessResponse({
    message: 'Tactical design retrieved successfully',
    model: TacticalDesignResponseDto,
  })
  @ApiCommonErrorResponses()
  async getTactical(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.exercisesService.getTacticalDesign(id, user);
    return {
      success: true,
      message: 'Tactical design retrieved successfully',
      data,
    };
  }

  @Put(':id/tactical')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Guardar diseño táctico del ejercicio' })
  @ApiUuidParam('id', 'Identificador del ejercicio')
  @ApiTypedSuccessResponse({
    message: 'Tactical design updated successfully',
    model: TacticalDesignResponseDto,
  })
  @ApiCommonErrorResponses()
  async updateTactical(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTacticalDesignDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.exercisesService.updateTacticalDesign(id, dto, user);
    return {
      success: true,
      message: 'Tactical design updated successfully',
      data,
    };
  }

  @Put(':id/tactical-preview')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: Number(process.env.TACTICAL_PREVIEW_MAX_FILE_SIZE ?? 3_000_000),
      },
      fileFilter: (_req, file, callback) => {
        const allowed = ['image/webp', 'image/png', 'image/jpeg'];
        callback(null, allowed.includes(file.mimetype));
      },
    }),
  )
  @ApiOperation({ summary: 'Subir snapshot tactico del ejercicio' })
  @ApiUuidParam('id', 'Identificador del ejercicio')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiTypedSuccessResponse({
    message: 'Tactical preview uploaded successfully',
    model: TacticalDesignResponseDto,
  })
  @ApiCommonErrorResponses()
  async uploadTacticalPreview(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: UploadedTacticalPreview | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('A preview file is required');
    }

    const data = await this.exercisesService.updateTacticalPreview(id, file, user);
    return {
      success: true,
      message: 'Tactical preview uploaded successfully',
      data,
    };
  }
}
