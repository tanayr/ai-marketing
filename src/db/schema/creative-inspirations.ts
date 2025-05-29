import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { organizations } from "./organization";
import { users } from "./user";
import { templates } from "./templates";
import type { InferSelectModel } from "drizzle-orm";

// Create the creative inspirations table for Retouchr Studio
export const creativeInspirations = pgTable("creative_inspirations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  // Inspiration details
  name: text("name").notNull(),
  imageUrl: text("imageUrl").notNull(),
  prompt: text("prompt").notNull(),
  
  // Design dimensions
  width: text("width").notNull(),
  height: text("height").notNull(),
  
  // Tags for filtering
  tags: jsonb("tags").$type<string[]>(),
  
  // Reference to a linked template (optional)
  linkedTemplateId: uuid("linkedTemplateId").references(() => templates.id),
  
  // User who created this inspiration (super admin)
  createdById: text("createdById")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export type CreativeInspiration = InferSelectModel<typeof creativeInspirations>;

// Define relations
export const creativeInspirationsRelations = relations(creativeInspirations, ({ one }) => ({
  // Relation to the creator
  createdBy: one(users, {
    fields: [creativeInspirations.createdById],
    references: [users.id],
  }),
  // Relation to the linked template (if any)
  linkedTemplate: one(templates, {
    fields: [creativeInspirations.linkedTemplateId],
    references: [templates.id],
  }),
}));
