"use client";

import React from "react";
import { useAsset } from "@/lib/assets/useAssets";
import type { Metadata } from "next";
import { ArrowLeft, Download, Edit, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function AssetViewPage({ params }: { params: { assetId: string } }) {
  const { asset, isLoading, error } = useAsset(params.assetId);
  
  // Function to get the appropriate label for studio tool
  const getStudioToolLabel = (tool: string) => {
    const labels: Record<string, string> = {
      "image_editor": "Image Editor",
      "video_editor": "Video Editor",
      "banner_creator": "Banner Creator",
      "social_post_creator": "Social Post Creator",
      "ad_copy_generator": "Ad Copy Generator"
    };
    
    return labels[tool] || tool;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error || !asset) {
    return (
      <div className="container max-w-6xl py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/app/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Asset Not Found</h1>
        </div>
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          The requested asset could not be found. It may have been deleted or you don't have permission to view it.
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header with back button and title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/app/assets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{asset.name}</h1>
          <Badge 
            variant={asset.status === "ready" ? "default" : "secondary"}
            className="capitalize ml-2"
          >
            {asset.status}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/studio/${asset.studioTool}/editor/${asset.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {asset.type === "image" ? (
                <div className="relative w-full aspect-square max-h-[500px] rounded-md overflow-hidden border bg-accent/20">
                  <Image
                    src={asset.thumbnail || ""}
                    alt={asset.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-80 bg-accent/20 rounded-md">
                  <p className="text-muted-foreground">Preview not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Asset Metadata */}
        <div>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium">Asset Details</h3>
                <Separator className="my-3" />
                
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Type:</dt>
                    <dd className="font-medium capitalize">{asset.type}</dd>
                  </div>
                  
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created with:</dt>
                    <dd className="font-medium">{getStudioToolLabel(asset.studioTool)}</dd>
                  </div>
                  
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created:</dt>
                    <dd className="font-medium">
                      {asset.createdAt ? formatDistanceToNow(new Date(asset.createdAt), { addSuffix: true }) : 'Unknown'}
                    </dd>
                  </div>
                  
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Last updated:</dt>
                    <dd className="font-medium">
                      {asset.updatedAt ? formatDistanceToNow(new Date(asset.updatedAt), { addSuffix: true }) : 'Unknown'}
                    </dd>
                  </div>
                  
                  {asset.notes && (
                    <>
                      <Separator className="my-3" />
                      <div>
                        <dt className="text-muted-foreground mb-1">Notes:</dt>
                        <dd className="font-medium whitespace-pre-wrap">{asset.notes}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </div>
              
              {/* Generation settings section */}
              {asset.content?.settings && (
                <div>
                  <h3 className="text-lg font-medium">Generation Settings</h3>
                  <Separator className="my-3" />
                  
                  <dl className="space-y-3">
                    {Object.entries(asset.content.settings).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <dt className="text-sm text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
                        </dt>
                        <dd className="font-medium break-words">
                          {typeof value === 'string' ? value : JSON.stringify(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
