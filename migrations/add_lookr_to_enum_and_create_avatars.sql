-- Add 'lookr' to studio_tool enum if it doesn't exist
ALTER TYPE studio_tool ADD VALUE IF NOT EXISTS 'lookr';

-- Create avatars table for the Lookr Studio
CREATE TABLE IF NOT EXISTS "avatars" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "examples" JSONB,
  "metadata" JSONB,
  "organizationId" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "createdById" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
