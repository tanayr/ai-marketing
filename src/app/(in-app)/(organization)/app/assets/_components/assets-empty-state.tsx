"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileQuestion, Plus } from "lucide-react";
import Link from "next/link";

interface AssetsEmptyStateProps {
  title: string;
  description: string;
}

export default function AssetsEmptyState({ title, description }: AssetsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
      <Button asChild>
        <Link href="/app/studio">
          <Plus className="h-4 w-4 mr-2" />
          Create New Asset
        </Link>
      </Button>
    </div>
  );
}
