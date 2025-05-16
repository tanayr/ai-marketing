"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { useTeam } from "./TeamContext";

export function InviteTableRowSkeleton() {
  const { canManageTeam } = useTeam();
  
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-48" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      {canManageTeam && (
        <TableCell>
          <Skeleton className="h-8 w-8" />
        </TableCell>
      )}
    </TableRow>
  );
} 