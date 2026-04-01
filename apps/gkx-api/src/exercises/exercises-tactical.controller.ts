import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
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
import { GeneratePlayDto } from './dto/generate-play.dto';
import { GeneratePlayResponseDto } from './dto/generate-play-response.dto';
import { TacticalDesignResponseDto } from './dto/tactical-design-response.dto';
import { UpdateTacticalDesignDto } from './dto/update-tactical-design.dto';
import { ExercisesService } from './exercises.service';
import { TacticalPlayGeneratorOpenRouterService } from './tactical-play-generator-openrouter.service';
import { TacticalPlayGeneratorService } from './tactical-play-generator.service';

interface UploadedTacticalPreview {
  mimetype: string;
  buffer: Buffer;
}

@Controller('exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Exercises - Tactical Design')
@ApiBearerAuth('jwt-auth')
export class ExercisesTacticalController {
  constructor(
    private readonly exercisesService: ExercisesService,
    private readonly tacticalPlayGenerator: TacticalPlayGeneratorService,
    private readonly tacticalPlayGeneratorOpenRouter: TacticalPlayGeneratorOpenRouterService,
  ) {}

  @Get(':id/tactical')
  @Roles(Role.SUPER_ADMIN, Role.USER)
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

  @Post(':id/tactical/generate')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar jugada táctica con IA',
    description:
      'Envía un prompt en lenguaje natural y recibe elementos tácticos listos para insertar en el editor. Requiere OPENAI_API_KEY configurado en el servidor.',
  })
  @ApiUuidParam('id', 'Identificador del ejercicio')
  @ApiTypedSuccessResponse({
    message: 'Play generated successfully',
    model: GeneratePlayResponseDto,
  })
  @ApiCommonErrorResponses()
  async generatePlay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GeneratePlayDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.tacticalPlayGenerator.generatePlay(id, dto, user);
    return {
      success: true,
      message: 'Play generated successfully',
      data,
    };
  }

  @Post(':id/tactical/generate-openrouter')
  @Roles(Role.SUPER_ADMIN, Role.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar jugada táctica con IA (OpenRouter)',
    description:
      'Ruta paralela de pruebas con OpenRouter. Requiere OPENROUTER_API_KEY configurado en el servidor.',
  })
  @ApiUuidParam('id', 'Identificador del ejercicio')
  @ApiTypedSuccessResponse({
    message: 'Play generated successfully (OpenRouter)',
    model: GeneratePlayResponseDto,
  })
  @ApiCommonErrorResponses()
  async generatePlayOpenRouter(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GeneratePlayDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.tacticalPlayGeneratorOpenRouter.generatePlay(
      id,
      dto,
      user,
    );
    return {
      success: true,
      message: 'Play generated successfully (OpenRouter)',
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
    const data = await this.exercisesService.updateTacticalDesign(
      id,
      dto,
      user,
    );
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
        fileSize: Number(
          process.env.TACTICAL_PREVIEW_MAX_FILE_SIZE ?? 3_000_000,
        ),
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

    const data = await this.exercisesService.updateTacticalPreview(
      id,
      file,
      user,
    );
    return {
      success: true,
      message: 'Tactical preview uploaded successfully',
      data,
    };
  }
}
