-- Update announcements table to match what we're using
ALTER TABLE announcements DROP COLUMN IF EXISTS specific_recipient;