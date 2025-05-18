"use client";

import React, { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssetsTable from "./_components/assets-table";
import AssetsEmptyState from "./_components/assets-empty-state";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useAssets } from "@/lib/assets/useAssets";

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<"published" | "drafts">("published");
  
  // Get current user's assets with the appropriate filter
  const publishedAssetsQuery = useAssets({ status: "ready" });
  const draftAssetsQuery = useAssets({ status: "draft" });

  const isLoading = publishedAssetsQuery.isLoading || draftAssetsQuery.isLoading;

  // Check if there's an error
  const hasError = publishedAssetsQuery.error || draftAssetsQuery.error;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/app">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">My Assets</h1>
        </div>
        
        <Button asChild>
          <Link href="/app/studio">
            <Plus className="h-4 w-4 mr-2" />
            Create New Asset
          </Link>
        </Button>
      </div>
      
      {/* Tabs for different asset statuses */}
      <Tabs 
        defaultValue="published" 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "published" | "drafts")}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="drafts">My Drafts</TabsTrigger>
        </TabsList>
        
        {/* Published assets tab */}
        <TabsContent value="published" className="mt-6">
          {hasError ? (
            <div className="py-6 text-center">
              <p className="text-destructive">There was an error loading your assets.</p>
              <Button 
                variant="outline" 
                onClick={() => publishedAssetsQuery.mutate()} 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : publishedAssetsQuery.assets?.length === 0 ? (
            <AssetsEmptyState 
              title="No published assets yet"
              description="Assets that are marked as ready will appear here."
            />
          ) : (
            <AssetsTable assets={publishedAssetsQuery.assets} />
          )}
        </TabsContent>
        
        {/* Draft assets tab */}
        <TabsContent value="drafts" className="mt-6">
          {hasError ? (
            <div className="py-6 text-center">
              <p className="text-destructive">There was an error loading your assets.</p>
              <Button 
                variant="outline" 
                onClick={() => draftAssetsQuery.mutate()} 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : draftAssetsQuery.assets?.length === 0 ? (
            <AssetsEmptyState 
              title="No draft assets yet"
              description="Assets that are in progress will appear here."
            />
          ) : (
            <AssetsTable assets={draftAssetsQuery.assets} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
