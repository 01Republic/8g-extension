// Minimal Product interface based on actual webapp usage
export interface ProductDto {
  id: number;
  nameKo: string;
  nameEn: string;
  image: string;
}

export interface ProductsResponse {
  items: ProductDto[];
  totalItemCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
