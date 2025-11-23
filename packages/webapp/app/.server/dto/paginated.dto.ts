import { Exclude, Expose, plainToClass } from "class-transformer";
import { PaginationMetaData } from "./pagination-meta-data.dto";

@Exclude()
export class Paginated<PaginatedEntity> {
  @Expose()
  items: PaginatedEntity[];

  @Expose()
  pagination: PaginationMetaData;

  constructor(
    items: PaginatedEntity[],
    totalItemCount: number,
    currentPage: number,
    itemsPerPage: number,
  ) {
    const totalPage =
      itemsPerPage === 0 ? 1 : Math.ceil(totalItemCount / itemsPerPage);

    this.items = items;
    this.pagination = plainToClass(PaginationMetaData, {
      totalItemCount,
      currentItemCount: items.length,
      totalPage: totalPage === 0 ? 1 : totalPage,
      currentPage,
      itemsPerPage,
    });
  }
}
