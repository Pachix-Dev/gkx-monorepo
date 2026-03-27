import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateTacticalDesignDto {
  @ApiProperty({
    type: 'object',
    description: 'Editor state as JSON',
    additionalProperties: true,
  })
  @IsObject()
  @IsNotEmpty()
  state!: Record<string, unknown>;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  stateVersion?: number;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/preview-abc123.webp',
  })
  @IsOptional()
  @IsString()
  previewUrl?: string;

  @ApiPropertyOptional({ example: 'sha256hash' })
  @IsOptional()
  @IsString()
  previewHash?: string;
}
