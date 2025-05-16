"use client";

import { useState, useEffect } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Product } from "./types";
import { useProducts } from "./products-api";
import { filterAndSortProducts } from "./product-utils";
import SearchFilters from "./search-filters";
import ProductTableHeader from "./product-table-header";
import ProductTableRow from "./product-table-row";
import ProductPagination from "./product-pagination";
import { LoadingState, ErrorState, EmptyState } from "./products-state";

interface ProductsTableProps {
  storeId: string;
}

export default function ProductsTable({ storeId }: ProductsTableProps) {
  // State for pagination, sorting, and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Fetch products using our custom hook
  const { products, isLoading, isError, mutate } = useProducts(storeId);

  // Toggle sort order
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Apply filtering and sorting whenever dependencies change
  useEffect(() => {
    // Only run if products exist
    if (products && products.length > 0) {
      const filtered = filterAndSortProducts(products, searchTerm, sortBy, sortOrder);
      setFilteredProducts(filtered);
      // Only reset page when search or sort changes, not on initial load
      if (currentPage !== 1 && (searchTerm || sortBy !== 'title' || sortOrder !== 'asc')) {
        setCurrentPage(1);
      }
    }
  }, [products, searchTerm, sortBy, sortOrder, currentPage]);
  
  // Initialize filteredProducts when products first load
  useEffect(() => {
    if (products && products.length > 0) {
      setFilteredProducts(products);
    }
  }, [products]);
  
  // Debug output for development
  console.log({
    productsFromAPI: products?.length || 0,
    filteredProducts: filteredProducts?.length || 0,
    isLoading
  });

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  // Handle loading state
  if (isLoading) {
    return <LoadingState isLoading={true} />;
  }

  // Handle error state
  if (isError) {
    return <ErrorState error={isError} retry={() => mutate()} />;
  }

  // Handle empty state
  if (!products || products.length === 0) {
    return <EmptyState isEmpty={true} hasSearchTerm={false} />;
  }
  
  // Handle filtered empty state (when search returns no results)
  if (filteredProducts.length === 0 && searchTerm) {
    return <EmptyState isEmpty={true} hasSearchTerm={true} />;
  }

  return (
    <div className="space-y-4">
      <SearchFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <div className="border rounded-md">
        <Table>
          <ProductTableHeader
            sortBy={sortBy}
            sortOrder={sortOrder}
            toggleSort={toggleSort}
          />
          <TableBody>
            {currentItems.map((product) => (
              <ProductTableRow
                key={product.id}
                product={product}
                storeId={storeId}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {currentItems.length > 0 && (
        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
}
