import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePlayResponseDto {
  @ApiPropertyOptional({
    description: 'ID del fondo sugerido por la IA (del catálogo de assets)',
    example: 'media-cancha-superior',
    nullable: true,
  })
  backgroundId!: string | null;

  @ApiPropertyOptional({
    description:
      'Ruta pública del fondo sugerido, lista para asignar en backgroundSrc del editor',
    example: '/editor-assets/backgrounds/media-cancha-superior.png',
    nullable: true,
  })
  backgroundSrc!: string | null;

  @ApiProperty({
    description:
      'Elementos tácticos generados, listos para insertar directamente en el store del editor (EditorElement[])',
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  elements!: Record<string, unknown>[];

  @ApiProperty({
    description: 'Resumen técnico de la jugada generada (en español)',
    example:
      'Ejercicio de blocaje lateral para sub-17. El portero parte del centro del área y reacciona a un disparo cruzado...',
  })
  summary!: string;

  @ApiProperty({
    description:
      'Advertencias del proceso de normalización (assets no encontrados en catálogo, coordenadas ajustadas, etc.)',
    type: 'array',
    items: { type: 'string' },
    example: [],
  })
  warnings!: string[];
}
