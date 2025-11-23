export interface ProductDto {
  id: number;
  nameKo: string;
  nameEn: string;
  desc: string;
  searchText: string;
  image: string;
  tagline?: string;
  ogImageUrl?: string;
  homepageUrl?: string;
  pricingPageUrl?: string;
  companyName?: string;
  connectMethod?: string;
  isAutoTrackable?: boolean;
  isFreeTierAvailable?: boolean;
  connectedOrgCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  items: ProductDto[];
  totalItemCount: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}
