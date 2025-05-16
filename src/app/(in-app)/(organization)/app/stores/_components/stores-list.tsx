"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, ArrowRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";

// Interface for store data from our API
interface StoreData {
  id: string;
  name: string;
  url: string;
  category: string | null;
  icon: string | null;
  productsCount?: number;
  lastSyncedAt?: string;
}

export default function StoresList() {
  const [syncingStoreId, setSyncingStoreId] = useState<string | null>(null);
  
  // Fetch stores from our internal API (which gets data from our database)
  const { data: stores, error, isLoading, mutate } = useSWR<StoreData[]>('/api/app/stores');

  const handleSyncProducts = async (storeId: string) => {
    setSyncingStoreId(storeId);

    try {
      // This would be a real API call to sync products
      // In the future, you'll implement an endpoint like:
      // await fetch(`/api/app/stores/${storeId}/sync-products`, { method: 'POST' });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After sync completes, refresh the store data
      mutate();
    } catch (error) {
      console.error("Error syncing products:", error);
    } finally {
      setSyncingStoreId(null);
    }
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive">Failed to load stores</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => mutate()}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Handle empty state
  if (!stores || stores.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No stores found.</p>
        <p className="text-sm text-muted-foreground mb-4">Add your first store to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stores.map(store => (
        <Card key={store.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-lg">{store.name}</h3>
                <Badge variant="outline">{store.category || "Store"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{store.url}</p>
              <div className="flex flex-col gap-1 text-sm">
                {store.productsCount !== undefined && (
                  <p><span className="text-muted-foreground">Products:</span> {store.productsCount}</p>
                )}
                {store.lastSyncedAt && (
                  <p>
                    <span className="text-muted-foreground">Last synced:</span>{' '}
                    {new Date(store.lastSyncedAt).toLocaleDateString()} at{' '}
                    {new Date(store.lastSyncedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/20 px-6 py-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSyncProducts(store.id)}
              disabled={syncingStoreId === store.id}
            >
              {syncingStoreId === store.id ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Products
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/app/stores/${store.id}`}>
                View Store
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
