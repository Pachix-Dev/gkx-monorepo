import { PartialType } from '@nestjs/mapped-types';
import { CreateTrainingLineDto } from './create-training-line.dto';

export class UpdateTrainingLineDto extends PartialType(CreateTrainingLineDto) {}
