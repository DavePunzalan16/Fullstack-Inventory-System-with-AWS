-- Add nullable passwordHash for local email/password auth (Batch 3).
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Enforce unique email for login lookups.
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");