import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class FilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsObject()
  filter?: Record<string, string>;

  @IsOptional()
  @IsString()
  sortField?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
