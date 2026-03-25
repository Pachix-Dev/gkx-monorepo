import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class StripeWebhookDto {
  @ApiProperty({ example: 'evt_123' })
  @IsString()
  id!: string;

  @ApiProperty({ example: 'customer.subscription.updated' })
  @IsString()
  type!: string;

  @ApiProperty({
    example: {
      object: {
        id: 'sub_123',
        status: 'active',
      },
    },
  })
  @IsObject()
  data!: { object: Record<string, unknown> };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  request?: Record<string, unknown>;
}