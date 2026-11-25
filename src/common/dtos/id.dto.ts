import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class IDParam {
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  id: number;
}
