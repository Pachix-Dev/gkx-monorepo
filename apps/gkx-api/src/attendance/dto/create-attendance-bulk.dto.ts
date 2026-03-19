import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../attendance.entity';

class AttendanceBulkItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  goalkeeperId!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class CreateAttendanceBulkDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sessionId!: string;

  @ApiProperty({ type: [AttendanceBulkItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceBulkItemDto)
  items!: AttendanceBulkItemDto[];
}
