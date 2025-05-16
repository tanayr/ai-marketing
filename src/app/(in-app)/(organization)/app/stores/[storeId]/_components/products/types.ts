// Product type definitions

export interface ProductVariant {
  id: string;
  productId: string;
  shopifyVariantId: string;
  title: string;
  price: string;
  compareAtPrice?: string | null;
  sku?: string | null;
  option1?: string | null;
  option2?: string | null;
  option3?: string | null;
  grams?: number;
  requiresShipping?: boolean;
  taxable?: boolean;
  available: boolean; // Required for UI
  position?: number;
  featuredImageId?: string | null;
  featuredImageSrc?: string | null;
  createdAt?: string;
  updatedAt?: string;
  shopifyCreatedAt?: string;
  shopifyUpdatedAt?: string;
}

export interface ProductImage {
  id: string;
  src: string;
  width: number;
  height: number;
  position?: number;
  variant_ids?: string[];
}

export interface ProductOption {
  name: string;
  values: string[];
  position: number;
}

export interface Product {
  id: string;
  storeId: string;
  shopifyProductId: string;
  title: string;
  productType?: string;
  vendor?: string;
  description?: string;
  tags?: string;
  handle?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  shopifyCreatedAt?: string;
  shopifyUpdatedAt?: string;
  options?: ProductOption[];
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ProductsTableProps {
  storeId: string;
}

export interface SortConfig {
  field: string;
  order: "asc" | "desc";
}
