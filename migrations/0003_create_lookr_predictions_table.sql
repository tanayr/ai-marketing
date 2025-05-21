-- Migration to create the lookr_predictions table and its enum type

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lookr_prediction_status') THEN
        CREATE TYPE lookr_prediction_status AS ENUM (
            'PENDING',
            'PROCESSING',
            'COMPLETED',
            'FAILED',
            'ARCHIVED'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "lookr_predictions" (
    "id" TEXT PRIMARY KEY DEFAULT (crypto.randomUUID()),
    "fashn_ai_prediction_id" TEXT NOT NULL UNIQUE,
    "status" lookr_prediction_status DEFAULT 'PENDING' NOT NULL,
    "source_model_image_url" TEXT NOT NULL,
    "source_garment_image_url" TEXT NOT NULL,
    "input_params" JSONB,
    "organization_id" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
    "created_by_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "asset_id" TEXT REFERENCES "assets"("id") ON DELETE SET NULL,
    "error_message" TEXT,
    "poll_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT now() NOT NULL
);

-- Optional: Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS "lookr_predictions_status_idx" ON "lookr_predictions" ("status");
CREATE INDEX IF NOT EXISTS "lookr_predictions_organization_id_idx" ON "lookr_predictions" ("organization_id");
CREATE INDEX IF NOT EXISTS "lookr_predictions_created_by_id_idx" ON "lookr_predictions" ("created_by_id");
