"use client";

import { Product, ProductVariant } from "./types";

// Calculate price range for a product
export const getPriceRange = (variants: ProductVariant[]) => {
  if (!variants || !variants.length) return "N/A";

  const prices = variants
    .filter(v => v.price) // Only include variants with valid price
    .map(v => parseFloat(v.price));
    
  if (prices.length === 0) return "N/A";
  
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Format price with appropriate currency based on locale
  return minPrice === maxPrice
    ? `$${minPrice.toFixed(2)}`
    : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
};

// Check if a variant is available
export const isVariantAvailable = (variant: ProductVariant): boolean => {
  // If the variant has an explicit available property, use it
  if (typeof variant.available === 'boolean') {
    return variant.available;
  }
  
  // Otherwise assume it's available (since API doesn't provide this directly)
  return true;
};

// Filter and sort products
export const filterAndSortProducts = (
  products: Product[], 
  searchTerm: string, 
  sortBy: string, 
  sortOrder: "asc" | "desc"
): Product[] => {
  if (!products || products.length === 0) return [];

  try {
    // Create a new array to avoid mutating the original
    let result = [...products];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.shopifyProductId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.vendor && product.vendor.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      // Special case for variants (sort by count)
      if (sortBy === 'variants') {
        const countA = a.variants?.length || 0;
        const countB = b.variants?.length || 0;
        return sortOrder === 'asc' ? countA - countB : countB - countA;
      }
      
      // For all other fields
      let valueA: any = a[sortBy as keyof Product] || '';
      let valueB: any = b[sortBy as keyof Product] || '';

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  } catch (error) {
    console.error('Error filtering/sorting products:', error);
    return [...products]; // Return original products if there's an error
  }
};
