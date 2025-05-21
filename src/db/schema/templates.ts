import { relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  boolean, 
  jsonb
} from "drizzle-orm/pg-core";
import { users } from "./user";
import { organizations } from "./organization";

// Template Schema - stores template metadata and content
export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Template dimensions when created
  width: text("width").notNull(),
  height: text("height").notNull(),
  
  // Template content (layers and their positions)
  templateContent: jsonb("template_content").notNull(),
  
  // Thumbnail image URL for display in template picker
  thumbnailUrl: text("thumbnail_url"),
  
  // Template category - can be user-defined
  category: text("category"),
  
  // Tags for filtering and organizing templates
  tags: jsonb("tags").$type<string[]>(),
  
  // Flag to indicate if this template is common to all organizations
  isCommon: boolean("is_common").default(true).notNull(),
  
  // Optional organization ID (null for common templates)
  organizationId: text("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  
  // Creation and update timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Creator reference (super-admin or org user)
  createdById: text("created_by_id").references(() => users.id),
});

// Relations
export const templatesRelations = relations(templates, ({ one }) => ({
  createdBy: one(users, {
    fields: [templates.createdById],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [templates.organizationId],
    references: [organizations.id],
  }),
}));

export type Template = {
  id: string;
  name: string;
  description: string | null;
  width: string;
  height: string;
  templateContent: any;
  thumbnailUrl: string | null;
  isCommon: boolean;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
}
