import {
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  In,
} from 'typeorm';
import { FilterDto, SortOrder } from '../dtos/filter.dto';

export interface FilterBuilderOptions {
  filter: FilterDto;
  searchField?: string;
  skipSearch?: boolean;
}

export function buildFilter<T>(
  options: FilterBuilderOptions,
): Partial<FindManyOptions<T>> {
  let order: FindOptionsOrder<any> = {};
  const whereOption: FindOptionsWhere<any> = {};

  if (options.filter.sortField) {
    order = {
      [options.filter.sortField]:
        options.filter.sortOrder === SortOrder.ASC ? 1 : -1,
    };
  }

  const searchField = options.searchField ?? 'name';

  if (!options.skipSearch && options.filter.search) {
    whereOption[searchField] = ILike(`%${options.filter.search}%`);
  }

  if (options.filter.filter) {
    for (const [key, value] of Object.entries(options.filter.filter)) {
      whereOption[key] = Array.isArray(value) ? In(value) : value;
    }
  }

  return {
    where: whereOption,
    order: order,
  };
}
