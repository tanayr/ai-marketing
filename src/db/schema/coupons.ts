import {
  timestamp,
  pgTable,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./user";
import { organizations } from "./organization";

export const coupons = pgTable("coupon", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").unique().notNull(),
  
  // Usage tracking
  organizationId: text("organizationId").references(() => organizations.id),
  usedByUserId: text("usedByUserId").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  usedAt: timestamp("usedAt", { mode: "date" }),
  
  // Status
  expired: boolean("expired").default(false),
});
