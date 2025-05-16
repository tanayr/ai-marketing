"use client";

import Image from "next/image";
import Link from "next/link";
import { EyeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Product } from "./types";
import { getPriceRange } from "./product-utils";

interface ProductTableRowProps {
  product: Product;
  storeId: string;
}

export default function ProductTableRow({ product, storeId }: ProductTableRowProps) {
  return (
    <TableRow key={product.id}>
      <TableCell>
        <div className="flex items-center">
          {(product.images?.[0]?.src || product.variants?.[0]?.featuredImageSrc) && (
            <Image
              src={product.images?.[0]?.src || product.variants?.[0]?.featuredImageSrc || ''}
              alt={product.title}
              width={40}
              height={40}
              className="rounded-md mr-3 object-cover"
            />
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium">{product.title}</div>
        <div className="text-xs text-muted-foreground">ID: {product.shopifyProductId}</div>
      </TableCell>
      <TableCell>{product.variants.length}</TableCell>
      <TableCell>{getPriceRange(product.variants)}</TableCell>
      <TableCell>
        <Badge
          variant={product.status === "active" ? "default" : "secondary"}
        >
          {product.status || "inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="sm"
          title="View product details"
          onClick={() => {
            // Show product details in an alert for now
            // In a real app, you would navigate to a product detail page or open a modal
            alert(`Product Details\n\nTitle: ${product.title}\nID: ${product.shopifyProductId}\nVariants: ${product.variants.length}\nStatus: ${product.status || 'inactive'}\nVendor: ${product.vendor || 'N/A'}`);
          }}
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}
