import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTrainingLineDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ example: 'Calentamiento' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    example: 'Bloque inicial de activacion y preparacion',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
