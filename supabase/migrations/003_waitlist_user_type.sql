ALTER TABLE waitlist
  ADD COLUMN IF NOT EXISTS user_type TEXT;

ALTER TABLE waitlist
  DROP CONSTRAINT IF EXISTS waitlist_user_type_check;

ALTER TABLE waitlist
  ADD CONSTRAINT waitlist_user_type_check
  CHECK (user_type IS NULL OR user_type IN ('athlete', 'coach', 'parent'));
