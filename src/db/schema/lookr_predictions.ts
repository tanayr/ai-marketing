import {
  timestamp,
  pgTable,
  text,
  jsonb,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { organizations } from "./organization";
import { users } from "./user";
import { assets } from "./assets"; // For potential foreign key if asset created after completion
import type { InferSelectModel } from "drizzle-orm";

// Enum for Lookr prediction job status
export const lookrPredictionStatusEnum = pgEnum("lookr_prediction_status", [
  "PENDING",    // Job created, not yet picked up by poller (or initial state)
  "PROCESSING", // Polling in progress
  "COMPLETED",  // Fashn AI job successful, asset generated
  "FAILED",     // Fashn AI job failed or error during polling
  "ARCHIVED",   // Job is old, potentially for cleanup
]);

export const lookrPredictions = pgTable("lookr_predictions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  fashnAiPredictionId: text("fashn_ai_prediction_id").notNull().unique(), // ID from Fashn.ai
  
  status: lookrPredictionStatusEnum("status").default("PENDING").notNull(),
  
  sourceModelImageUrl: text("source_model_image_url").notNull(),
  sourceGarmentImageUrl: text("source_garment_image_url").notNull(),
  inputParams: jsonb("input_params"), // Store options sent to Fashn.ai

  // Foreign keys
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  
  // Link to the final asset once completed
  // This can be nullable if the asset record is only created/finalized upon successful completion
  assetId: text("asset_id").references(() => assets.id, { onDelete: "set null" }),

  errorMessage: text("error_message"), // Store error details if the job failed
  pollCount: integer("poll_count").default(0), // How many times status was polled

  // Timestamps
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export type LookrPrediction = InferSelectModel<typeof lookrPredictions>;
