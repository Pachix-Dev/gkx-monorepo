import { PartialType } from '@nestjs/mapped-types';
import { CreateSessionContentDto } from './create-session-content.dto';

export class UpdateSessionContentDto extends PartialType(
  CreateSessionContentDto,
) {}
