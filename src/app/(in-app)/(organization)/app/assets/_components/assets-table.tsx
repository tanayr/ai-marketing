"use client";

import React from "react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash2, Image, Video, FileText } from "lucide-react";
import Link from "next/link";
import { Asset } from "@/db/schema/assets";
import { formatDistanceToNow } from "date-fns";
import { useAssets } from "@/lib/assets/useAssets";

interface AssetsTableProps {
  assets: Asset[];
}

export default function AssetsTable({ assets }: AssetsTableProps) {
  const { deleteAsset } = useAssets();

  // Function to get the appropriate icon based on asset type
  const getAssetTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'content':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Function to get the right label for studio tool
  const getStudioToolLabel = (tool: string) => {
    const toolMap: Record<string, string> = {
      'image_editor': 'Image Editor',
      'video_editor': 'Video Editor',
      'banner_creator': 'Banner Creator',
      'social_post_creator': 'Social Posts',
      'ad_copy_generator': 'Ad Copy',
    };
    
    return toolMap[tool] || tool;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Tool</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getAssetTypeIcon(asset.type)}
                  <span>{asset.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {asset.type}
                </Badge>
              </TableCell>
              <TableCell>{getStudioToolLabel(asset.studioTool)}</TableCell>
              <TableCell>
                <Badge 
                  variant={asset.status === "ready" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {asset.status}
                </Badge>
              </TableCell>
              <TableCell>
                {asset.updatedAt ? formatDistanceToNow(new Date(asset.updatedAt), { 
                  addSuffix: true 
                }) : "Unknown"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/app/assets/${asset.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={asset.studioTool === "image_editor" 
                      ? `/app/studio/retouchr?id=${asset.id}` 
                      : `/app/studio?assetId=${asset.id}`
                    }>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this asset?")) {
                        deleteAsset(asset.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
