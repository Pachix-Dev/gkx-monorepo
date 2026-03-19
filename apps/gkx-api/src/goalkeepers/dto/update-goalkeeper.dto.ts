import { PartialType } from '@nestjs/mapped-types';
import { CreateGoalkeeperDto } from './create-goalkeeper.dto';

export class UpdateGoalkeeperDto extends PartialType(CreateGoalkeeperDto) {}
