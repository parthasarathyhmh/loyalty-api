import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PageDto {
  @Type(() => Number)
  @IsOptional()
  @IsPositive()
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @IsInt()
  limit?: number;
}
