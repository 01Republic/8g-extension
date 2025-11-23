import type { ProductsResponse } from "./types";

const PRODUCT_API_BASE_URL =
  process.env.PRODUCT_API_BASE_URL || "http://localhost:8000";

export async function fetchProducts(params?: {
  isLive?: boolean;
  keyword?: string;
  itemsPerPage?: number;
}): Promise<ProductsResponse> {
  const queryParams = new URLSearchParams();

  if (params?.isLive !== undefined) {
    queryParams.append("isLive", String(params.isLive));
  }
  if (params?.keyword) {
    queryParams.append("keyword", params.keyword);
  }
  if (params?.itemsPerPage) {
    queryParams.append("itemsPerPage", String(params.itemsPerPage));
  }

  const url = `${PRODUCT_API_BASE_URL}/products?${queryParams.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  return response.json();
}
