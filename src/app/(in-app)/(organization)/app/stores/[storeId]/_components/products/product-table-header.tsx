"use client";

import { ArrowDownUp } from "lucide-react";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductTableHeaderProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  toggleSort: (field: string) => void;
}

export default function ProductTableHeader({ 
  sortBy, 
  sortOrder, 
  toggleSort 
}: ProductTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[50px]"></TableHead>
        <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
          <div className="flex items-center">
            Product
            {sortBy === "title" && (
              <ArrowDownUp className={`ml-1 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
            )}
          </div>
        </TableHead>
        <TableHead className="cursor-pointer" onClick={() => toggleSort("variants")}>
          <div className="flex items-center">
            Variants
            {sortBy === "variants" && (
              <ArrowDownUp className={`ml-1 h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`} />
            )}
          </div>
        </TableHead>
        <TableHead>Price</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
