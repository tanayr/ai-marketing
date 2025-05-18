-- Add Dodo payment fields to organization table
ALTER TABLE "organization" 
ADD COLUMN IF NOT EXISTS "dodoCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "dodoSubscriptionId" TEXT;

-- Add Dodo payment fields to plans table
ALTER TABLE "plans"
ADD COLUMN IF NOT EXISTS "monthlyDodoProductId" TEXT,
ADD COLUMN IF NOT EXISTS "yearlyDodoProductId" TEXT,
ADD COLUMN IF NOT EXISTS "onetimeDodoProductId" TEXT;
