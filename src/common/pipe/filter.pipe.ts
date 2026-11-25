import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { FilterDto } from '../dtos/filter.dto';

const FilterKeyReg = /^(filter)(?:\[)([a-zA-Z][a-zA-Z-0-9]+)(?:\])$/;

export interface FilterPipeConfig {
  sortable?: string[];
  filterable?: string[];
}

/**
 * QueryPipe works in Query decorator for controller methods
 *
 * ```ts
 * @Query(new QueryPipe(
 *  {
 *    sortable: ['id'],
 *    filterable: ['name', 'type']
 *  }
 * )) query: FilterDto
 *
 * ```
 * and then we can use validated data from it
 *
 * ```ts
 * const { filters project, pages } = query
 * ```
 */
@Injectable()
export class FilterPipe implements PipeTransform {
  constructor(private config: FilterPipeConfig = {}) {}

  async transform(
    value: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _metadata: ArgumentMetadata,
  ): Promise<FilterDto> {
    const { search, sort, ...rest } = value;

    let filterObject = {};
    try {
      filterObject = Object.fromEntries(
        Object.entries(rest ?? {})
          .filter(([key]) => FilterKeyReg.test(key))
          .map(([key, val]) => {
            const [, , finalKey] = key.match(FilterKeyReg);
            return [finalKey, val];
          }),
      );
    } catch (e) {
      throw new BadRequestException('Invalid filter query');
    }

    const result: Record<string, any> = {};

    // Search
    if (search) {
      let decodedSearch: string;
      try {
        decodedSearch = search ? decodeURIComponent(search) : undefined;
      } catch (e) {
        throw new BadRequestException('Invalid search query');
      }
      result.search = decodedSearch;
    }

    // Filter handling
    if (filterObject) {
      const parsedFilter = {};
      for (const key in filterObject) {
        if (!this.config.filterable?.includes(key)) {
          throw new BadRequestException(
            `Filtering by field "${key}" is not allowed`,
          );
        }
        try {
          const rawValue = filterObject[key];
          parsedFilter[key] = rawValue.includes(',')
            ? decodeURIComponent(rawValue).split(',')
            : decodeURIComponent(rawValue);
        } catch (e) {
          throw new BadRequestException(`Invalid encoding in filter: ${key}`);
        }
      }
      result.filter = parsedFilter;
    }

    // Sort handling
    if (sort) {
      const sortParts = sort.split(':');

      if (sortParts.length !== 2) {
        throw new BadRequestException(
          'Sort must be in the format "field:ASC" or "field:DESC"',
        );
      }

      const [sortField, sortOrder] = sortParts;

      if (!this.config.sortable?.includes(sortField)) {
        throw new BadRequestException(`Invalid sorting field "${sortField}"`);
      }

      const validSortOrders = ['ASC', 'DESC'];
      if (!validSortOrders.includes(sortOrder.toUpperCase())) {
        throw new BadRequestException(
          `Invalid sort order: "${sortOrder}". Use 'ASC' or 'DESC'.`,
        );
      }

      result.sortField = sortField;
      result.sortOrder = sortOrder;
    }

    const filterResult: FilterDto = plainToClass(FilterDto, {
      search: result?.search,
      sortField: result.sortField,
      sortOrder: result.sortOrder ?? 'ASC',
      filter: result.filter ?? {},
    });

    const filterErrors = await validate(filterResult);
    if (filterErrors.length > 0) {
      const validationErrors = filterErrors
        .map((err) => Object.values(err.constraints || {}).join(', '))
        .join('; ');
      throw new BadRequestException(`Validation failed: ${validationErrors}`);
    }

    return filterResult;
  }
}
