import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TacticalDesignResponseDto {
  @ApiProperty({ format: 'uuid' })
  exerciseId!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
  })
  state!: Record<string, unknown> | null;

  @ApiProperty({ example: 1 })
  stateVersion!: number | null;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/preview-abc123.webp',
  })
  previewUrl?: string | null;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string | null;
}
