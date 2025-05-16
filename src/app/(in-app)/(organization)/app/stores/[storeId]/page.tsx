"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import useCurrentPlan from "@/lib/users/useCurrentPlan";
import ProductsTable from "./_components/products-table";
import LoadingSpinner from "@/components/ui/loading-spinner";
// Removed toast import as it's causing build errors
import useSWR, { mutate } from "swr";

// Fetcher function to get store data
const fetchStore = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch store data');
  }
  return res.json();
};

// Fetcher function to get products count
const fetchProductsCount = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return 0; // Default to 0 if can't fetch products
    }
    const products = await res.json();
    
    // Make sure we return a number, not the products array itself
    if (Array.isArray(products)) {
      return products.length;
    } else if (typeof products === 'object' && products !== null) {
      // If we got an object with results or data property
      if (Array.isArray(products.results)) {
        return products.results.length;
      } else if (Array.isArray(products.data)) {
        return products.data.length;
      } else {
        console.warn('Unexpected products response format:', products);
        return 0;
      }
    }
    return 0;
  } catch (error) {
    console.error('Error fetching products count:', error);
    return 0;
  }
};

export default function StorePage() {
  const { storeId } = useParams() as { storeId: string };
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const { currentPlan, isLoading: planLoading } = useCurrentPlan();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Required plan for this feature
  const requiredPlanCodename = "monthly";
  
  // Check if user has access
  const hasAccess = currentPlan?.codename === requiredPlanCodename;
  
  // Fetch store data using SWR
  const { data: store, error: storeError, isLoading: storeLoading } = useSWR(
    `/api/app/stores/${storeId}`, 
    fetchStore
  );
  
  // Fetch products count
  const { data: productsCount = 0, isLoading: productsLoading } = useSWR(
    `/api/app/stores/${storeId}/products`, 
    fetchProductsCount
  );
  
  // Combined loading state
  const isLoading = planLoading || storeLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to stores page if user doesn't have access
  if (!hasAccess) {
    router.push("/app/stores");
    return null;
  }

  const handleSyncProducts = async () => {
    setIsSyncing(true);
    
    try {
      // Call the sync products API
      const response = await fetch(`/api/app/stores/${storeId}/products/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync products');
      }
      
      // Show success message
      setStatusMessage({
        type: 'success',
        message: `Successfully synced ${result.productCount} products.`
      });
      
      // Refresh data
      mutate(`/api/app/stores/${storeId}`);
      mutate(`/api/app/stores/${storeId}/products`);
    } catch (error) {
      console.error("Error syncing products:", error);
      setStatusMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle error states
  if (storeError) {
    return (
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/app/stores">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Store not found</h1>
        </div>
        <Card className="p-6">
          <p>There was an error loading the store. Please try again later.</p>
          <Button className="mt-4" onClick={() => router.push('/app/stores')}>
            Back to Stores
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/app/stores">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{store?.name || 'Loading...'}</h1>
          {store?.category && <Badge variant="outline">{store.category}</Badge>}
        </div>
      </div>
      
      {/* Display status messages */}
      {statusMessage && (
        <div className={`p-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex">
            <div className="ml-3">
              <p className="font-medium">{statusMessage.type === 'success' ? 'Success' : 'Error'}</p>
              <p className="text-sm">{statusMessage.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button 
                  type="button" 
                  className="inline-flex rounded-md p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none"
                  onClick={() => setStatusMessage(null)}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Store Details</h2>
            <p className="text-sm text-muted-foreground">{store?.url || 'Loading...'}</p>
          </div>
          
          <Button 
            onClick={handleSyncProducts} 
            disabled={isSyncing || storeLoading}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing Products...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Products
              </>
            )}
          </Button>
        </div>
        
        <div className="text-sm mb-4">
          <p className="mb-1">
            <span className="font-medium">Last Synced:</span>{' '}
            {store?.lastSyncedAt ? (
              <>
                {new Date(store.lastSyncedAt).toLocaleDateString()} at{' '}
                {new Date(store.lastSyncedAt).toLocaleTimeString()}
              </>
            ) : 'Never'}
          </p>
          <p>
            <span className="font-medium">Products Count:</span> {typeof productsCount === 'number' ? productsCount : 0}
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Products</h3>
          <ProductsTable storeId={storeId} />
        </div>
      </Card>
    </div>
  );
}
