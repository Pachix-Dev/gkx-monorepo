import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestEmailVerificationDto {
  @ApiProperty({ example: 'coach@gkacademy.com' })
  @IsEmail()
  email!: string;
}
