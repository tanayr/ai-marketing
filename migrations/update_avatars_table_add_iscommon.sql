-- Add isCommon flag to avatars table
ALTER TABLE "avatars" ADD COLUMN IF NOT EXISTS "isCommon" BOOLEAN DEFAULT FALSE;

-- Make organizationId nullable for common avatars
ALTER TABLE "avatars" ALTER COLUMN "organizationId" DROP NOT NULL;
