"use client";

import useSWR from "swr";
import { Product } from "./types";

// Fetcher function to get products data
export const fetchProducts = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }
  return res.json();
};

// Hook to fetch products for a store
export function useProducts(storeId: string) {
  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    `/api/app/stores/${storeId}/products`,
    fetchProducts
  );
  
  return {
    products: data || [],
    isLoading,
    isError: error,
    mutate
  };
}
