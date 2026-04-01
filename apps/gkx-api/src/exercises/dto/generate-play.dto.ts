import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum GeneratePlayMode {
  REPLACE = 'replace',
  APPEND = 'append',
}

export class GeneratePlayDto {
  @ApiProperty({
    description:
      'Descripción en lenguaje natural de la jugada a generar. Sé específico: posiciones, materiales, objetivos.',
    example:
      'Portero sub-17, blocaje lateral y salida rápida a segundo poste con 4 conos y 1 balón en media cancha.',
    maxLength: 600,
  })
  @IsString()
  @MaxLength(600)
  prompt!: string;

  @ApiPropertyOptional({
    description:
      'Cómo aplicar la jugada generada al canvas actual. "replace" limpia el canvas, "append" agrega elementos.',
    enum: GeneratePlayMode,
    default: GeneratePlayMode.REPLACE,
  })
  @IsOptional()
  @IsEnum(GeneratePlayMode)
  mode?: GeneratePlayMode;

  @ApiPropertyOptional({
    description: 'Categoría o rango de edad (ej: sub-15, sub-17, senior)',
    example: 'sub-17',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @ApiPropertyOptional({
    description: 'Número de porteros a incluir en la jugada',
    minimum: 1,
    maximum: 4,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  goalkeepersCount?: number;

  @ApiPropertyOptional({
    description:
      'ID de fondo del catálogo preferido por el entrenador (si no se especifica, la IA elige)',
    example: 'media-cancha-superior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  backgroundId?: string;
}
