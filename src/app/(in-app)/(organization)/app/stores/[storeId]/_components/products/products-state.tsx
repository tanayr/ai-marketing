"use client";

import { Button } from "@/components/ui/button";

interface LoadingStateProps {
  isLoading: boolean;
}

export function LoadingState({ isLoading }: LoadingStateProps) {
  if (!isLoading) return null;
  
  return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

interface ErrorStateProps {
  error: Error | null;
  retry: () => void;
}

export function ErrorState({ error, retry }: ErrorStateProps) {
  if (!error) return null;
  
  return (
    <div className="flex flex-col items-center py-10">
      <p className="text-red-500 mb-4">Error loading products</p>
      <Button variant="outline" onClick={retry}>
        Retry
      </Button>
    </div>
  );
}

interface EmptyStateProps {
  isEmpty: boolean;
  hasSearchTerm: boolean;
}

export function EmptyState({ isEmpty, hasSearchTerm }: EmptyStateProps) {
  if (!isEmpty) return null;
  
  return (
    <div className="flex flex-col items-center py-10">
      <p className="mb-4">No products found</p>
      <p className="text-sm text-muted-foreground">
        {hasSearchTerm ? 'Try a different search term' : 'Sync products to see them here'}
      </p>
    </div>
  );
}
