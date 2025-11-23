import { Product } from "../../db/entities";
import { AppDataSource, initializeDatabase } from "../../db/config";
import type { ProductsResponse, ProductDto } from "./types";

export async function fetchProducts(params?: {
  isLive?: boolean;
  keyword?: string;
  itemsPerPage?: number;
}): Promise<ProductsResponse> {
  // Initialize database connection if not already done
  await initializeDatabase();

  const productRepository = AppDataSource.getRepository(Product);
  
  let query = productRepository.createQueryBuilder("product");

  // Apply keyword search if provided
  if (params?.keyword) {
    query = query.where(
      "product.nameKo LIKE :keyword OR product.nameEn LIKE :keyword",
      { keyword: `%${params.keyword}%` }
    );
  }

  // Apply pagination
  const itemsPerPage = params?.itemsPerPage || 20;
  query = query.take(itemsPerPage);

  // Order by ID for consistent results
  query = query.orderBy("product.id", "ASC");

  const products = await query.getMany();
  
  // Transform to DTO format
  const items: ProductDto[] = products.map(product => ({
    id: product.id,
    nameKo: product.nameKo,
    nameEn: product.nameEn,
    image: product.image,
  }));

  return {
    items,
    totalItemCount: items.length,
    currentPage: 1,
    itemsPerPage,
    totalPages: 1,
  };
}
