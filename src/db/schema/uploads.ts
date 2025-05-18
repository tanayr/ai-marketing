import {
  timestamp,
  pgTable,
  text,
  primaryKey,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization";
import { users } from "./user";
import type { InferSelectModel } from "drizzle-orm";

export const uploads = pgTable("uploads", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organizationId")
    .references(() => organizations.id)
    .notNull(),
  userId: text("userId")
    .references(() => users.id)
    .notNull(),
  fileName: text("fileName").notNull(),
  fileKey: text("fileKey").notNull().unique(),
  fileUrl: text("fileUrl").notNull(),
  contentType: text("contentType").notNull(),
  filePath: text("filePath").notNull(),
  fileSize: text("fileSize"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export type Upload = InferSelectModel<typeof uploads>;
