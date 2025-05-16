import {
  timestamp,
  pgTable,
  text,
  jsonb,
} from "drizzle-orm/pg-core";
import { stores } from "./stores";
import type { InferSelectModel } from "drizzle-orm";

export const shopifyProducts = pgTable("shopify_products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  storeId: text("storeId")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  
  // Basic product data
  shopifyProductId: text("shopifyProductId").notNull(),
  title: text("title").notNull(),
  productType: text("productType"),
  vendor: text("vendor"),
  status: text("status"),
  description: text("description"),
  tags: text("tags"),
  handle: text("handle"),
  
  // Complex data stored as JSON
  options: jsonb("options").$type<{
    name: string;
    position: number;
    values: string[];
  }[]>(), // Product options like color, size
  
  images: jsonb("images").$type<{
    id: string;
    position: number;
    src: string;
    width: number;
    height: number;
    variant_ids?: string[];
  }[]>(),   // All product images
  
  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
  shopifyCreatedAt: timestamp("shopifyCreatedAt", { mode: "date" }),
  shopifyUpdatedAt: timestamp("shopifyUpdatedAt", { mode: "date" }),
});

export type ShopifyProduct = InferSelectModel<typeof shopifyProducts>;
