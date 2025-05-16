import {
  timestamp,
  pgTable,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { shopifyProducts } from "./shopify-products";
import type { InferSelectModel } from "drizzle-orm";

export const productVariants = pgTable("product_variants", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text("productId")
    .notNull()
    .references(() => shopifyProducts.id, { onDelete: "cascade" }),
  
  // Shopify variant data
  shopifyVariantId: text("shopifyVariantId").notNull(),
  title: text("title").notNull(),
  price: text("price"),
  compareAtPrice: text("compareAtPrice"),
  sku: text("sku"),
  
  // Variant options
  option1: text("option1"),
  option2: text("option2"),
  option3: text("option3"),
  
  // Additional properties
  grams: integer("grams"),
  requiresShipping: boolean("requiresShipping"),
  taxable: boolean("taxable"),
  available: boolean("available").default(true),
  position: integer("position"),
  
  // Image for this specific variant
  featuredImageId: text("featuredImageId"),
  featuredImageSrc: text("featuredImageSrc"),
  
  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
  shopifyCreatedAt: timestamp("shopifyCreatedAt", { mode: "date" }),
  shopifyUpdatedAt: timestamp("shopifyUpdatedAt", { mode: "date" }),
});

export type ProductVariant = InferSelectModel<typeof productVariants>;
