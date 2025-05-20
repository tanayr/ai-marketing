import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization";
import { users } from "./user";
import type { InferSelectModel } from "drizzle-orm";

// Create the avatars table for Lookr Studio
export const avatars = pgTable("avatars", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  // Avatar details
  name: text("name").notNull(),
  imageUrl: text("imageUrl").notNull(),
  
  // Examples of the avatar's output (array of URLs)
  examples: jsonb("examples").$type<string[]>(),
  
  // Additional metadata
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  
  // Flag to indicate if this is a common avatar available to all organizations
  isCommon: boolean("isCommon").default(false),
  
  // Organizational relationship - can be null for common avatars
  organizationId: text("organizationId")
    .references(() => organizations.id, { onDelete: "cascade" }),
  
  // User who created/last edited
  createdById: text("createdById")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export type Avatar = InferSelectModel<typeof avatars>;
