import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LayoutSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-screen bg-background", className)}>
      {/* Desktop Sidebar Skeleton */}
      <div className="hidden md:flex flex-col w-64 border-r border-border/40">
        <div className="p-3 flex-1">
          {/* Organization Switcher Skeleton */}
          <div className="mb-6 px-2">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          {/* Nav Items Skeleton */}
          <div className="space-y-1 px-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>

          {/* Bottom Items Skeleton */}
          <div className="mt-auto pt-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md mt-1" />
          </div>
        </div>
      </div>

      {/* Mobile Header Skeleton */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border/40 bg-background z-30 px-4">
        <div className="flex items-center justify-between h-full">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-6 max-w-7xl mx-auto w-full">
            <div className="space-y-4">
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-[200px] w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-[100px]" />
                <Skeleton className="h-[100px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 