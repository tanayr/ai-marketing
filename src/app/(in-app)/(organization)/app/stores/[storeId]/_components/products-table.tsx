"use client";

import { ProductsTable as ModularProductsTable } from './products/index';
import { ProductsTableProps } from './products/types';

// This is a wrapper component that uses our new modular implementation
// while maintaining the same interface as the original component
export default function ProductsTable({ storeId }: ProductsTableProps) {
  return <ModularProductsTable storeId={storeId} />;
}
