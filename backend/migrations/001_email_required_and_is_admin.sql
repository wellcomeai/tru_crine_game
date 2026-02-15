-- Migration: Make email required and add is_admin column
-- Apply with: psql $DATABASE_URL -f migrations/001_email_required_and_is_admin.sql
--
-- NOTE: This migration is needed only if the database already has existing data.
-- For fresh databases, the ORM model (create_tables) handles the schema correctly.

-- Step 1: Fill empty emails before adding NOT NULL constraint
UPDATE users SET email = username || '@placeholder.local' WHERE email IS NULL;

-- Step 2: Make email NOT NULL
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Step 3: Add is_admin column
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Downgrade (run manually if needed):
-- ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
-- ALTER TABLE users DROP COLUMN IF EXISTS is_admin;
