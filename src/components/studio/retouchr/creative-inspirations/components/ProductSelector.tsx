"use client";

import React, { useEffect, useState } from 'react';
import { ShopifyProduct } from '@/db/schema/shopify-products';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ProductSelectorProps {
  onSelect: (product: ShopifyProduct) => void;
  onBack: () => void;
  hideHeader?: boolean;
}

/**
 * Component for selecting a product to use with an inspiration
 */
export const ProductSelector: React.FC<ProductSelectorProps> = ({ 
  onSelect, 
  onBack,
  hideHeader = false
}) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all products from all stores in the organization
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/app/organizations/current/products');
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts(products);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = products.filter(product => 
      product.title.toLowerCase().includes(query) || 
      product.productType?.toLowerCase().includes(query) ||
      product.vendor?.toLowerCase().includes(query)
    );
    
    setFilteredProducts(filtered);
  }, [searchQuery, products]);
  
  const getProductFirstImage = (product: ShopifyProduct) => {
    if (!product.images || product.images.length === 0) {
      return null;
    }
    return product.images[0].src;
  };
  
  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Choose a Product</h2>
            <p className="text-muted-foreground">Select a product to use with the inspiration</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        
        <Badge variant="outline" className="px-3 py-1">
          {filteredProducts.length} products found
        </Badge>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-2">
                <Skeleton className="w-full h-48" />
                <Skeleton className="w-full h-5 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found. Please add products to your stores first.</p>
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => onSelect(product)}
            >
              <CardContent className="p-2">
                <div className="relative aspect-square w-full bg-gray-100 mb-2">
                  {getProductFirstImage(product) ? (
                    <Image
                      src={getProductFirstImage(product)!}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <h3 className="font-medium truncate">{product.title}</h3>
                {product.storeId && (
                  <p className="text-xs text-muted-foreground truncate">Store ID: {product.storeId}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
