-- Add missing columns to announcements table
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS recipients VARCHAR(50);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS sender VARCHAR(255);

-- Update existing data to use new structure
UPDATE announcements SET message = content WHERE message IS NULL;
UPDATE announcements SET recipients = target_audience WHERE recipients IS NULL;
UPDATE announcements SET sender = created_by WHERE sender IS NULL;