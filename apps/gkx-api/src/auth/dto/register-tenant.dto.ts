import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterTenantDto {
  @ApiProperty({ example: 'Elite GK Academy' })
  @IsString()
  @IsNotEmpty()
  tenantName!: string;

  @ApiPropertyOptional({ example: 'elite-gk-academy' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  tenantSlug?: string;

  @ApiProperty({ example: 'Carlos Ramirez' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'coach@gkacademy.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  password!: string;
}
