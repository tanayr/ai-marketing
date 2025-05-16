import {
  timestamp,
  pgTable,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization";
import type { InferSelectModel } from "drizzle-orm";

export const stores = pgTable("stores", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organizationId")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  icon: text("icon"),  // Store icon URL
  category: text("category"),  // Store category/niche
  
  // Store status
  isActive: boolean("isActive").default(true),
  lastSyncedAt: timestamp("lastSyncedAt", { mode: "date" }),
  
  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export type Store = InferSelectModel<typeof stores>;
