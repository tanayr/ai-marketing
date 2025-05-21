import {
  timestamp,
  pgTable,
  text,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization";
import { users } from "./user";
import { shopifyProducts } from "./shopify-products";
import type { InferSelectModel } from "drizzle-orm";
import { z } from "zod";

// Enum for asset status
export const assetStatusEnum = pgEnum("asset_status", ["draft", "ready"]);

// Enum for asset type
export const assetTypeEnum = pgEnum("asset_type", ["image", "video", "content"]);

// Enum for the studio tool type
export const studioToolEnum = pgEnum("studio_tool", [
  "image_editor", 
  "video_editor",
  "banner_creator",
  "social_post_creator",
  "ad_copy_generator",
  "retouchr", // Add retouchr studio tool
  "lookr", // Add lookr studio tool
  "cloner" // Add cloner studio tool
]);

// Content schema will vary based on the studio tool
export const assetContentSchema = z.object({
  // Common content properties
  version: z.number().default(1),
  
  // Tool-specific content (just an example structure)
  settings: z.record(z.unknown()).optional(),
  elements: z.array(z.unknown()).optional(),
  dimensions: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  
  // Fabric.js canvas data structure
  fabricCanvas: z.object({
    version: z.string().optional(),
    objects: z.array(z.any()).optional(),
    background: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  
  // Retouchr specific metadata
  retouchr: z.object({
    name: z.string().optional(),
    lastSavedBy: z.string().optional(),
    lastSavedAt: z.string().optional(),
    usedImages: z.array(z.string()).optional(), // References to files.id
  }).optional(),
  
  // Any additional tool-specific data
  metadata: z.record(z.unknown()).optional(),
});

export type AssetContent = z.infer<typeof assetContentSchema>;

// Create the assets table
export const assets = pgTable("assets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  // Asset details
  name: text("name").notNull(),
  type: assetTypeEnum("asset_type").notNull(),
  studioTool: studioToolEnum("studio_tool").notNull(),
  status: assetStatusEnum("status").default("draft"),
  thumbnail: text("thumbnail"), // URL to a thumbnail image
  
  // Content of the asset (varies by studio tool)
  content: jsonb("content").$type<AssetContent>(),
  
  // Organizational relationship
  organizationId: text("organizationId")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  
  // Optional product association
  productId: text("productId")
    .references(() => shopifyProducts.id, { onDelete: "set null" }),
  
  // User who created/last edited
  createdById: text("createdById")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lastEditedById: text("lastEditedById")
    .references(() => users.id, { onDelete: "set null" }),
  
  // Optional notes
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export type Asset = InferSelectModel<typeof assets>;

// Asset version history (optional - for tracking changes over time)
export const assetVersions = pgTable("asset_versions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  assetId: text("assetId")
    .notNull()
    .references(() => assets.id, { onDelete: "cascade" }),
  
  versionNumber: text("versionNumber").notNull(),
  content: jsonb("content").$type<AssetContent>(),
  
  createdById: text("createdById")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Optional snapshot notes
  notes: text("notes"),
  
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
});

export type AssetVersion = InferSelectModel<typeof assetVersions>;
