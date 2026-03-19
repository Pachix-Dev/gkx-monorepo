import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'raw-email-verification-token' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
