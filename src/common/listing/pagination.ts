import { FindManyOptions } from 'typeorm';

export class Page {
  currentPage: number;
  totalPages: number;
  count: number;
  limit: number;
  offset: number;
}

export class Paginated<T> {
  items: T[];
  pages: Page;
}

export function nextPage<T>(
  page: number,
  limit: number,
): Partial<FindManyOptions<T>> {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function pageData(page: number, total: number, limit: number): Page {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    totalPages,
    count: total,
    limit,
    offset: (page - 1) * limit,
  };
}
