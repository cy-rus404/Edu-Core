-- Update timetable table to replace room with time_frame
ALTER TABLE timetable 
DROP COLUMN IF EXISTS room,
ADD COLUMN IF NOT EXISTS time_frame VARCHAR(50);