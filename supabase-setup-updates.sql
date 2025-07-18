-- Create timetable table
CREATE TABLE IF NOT EXISTS timetable (
  id BIGSERIAL PRIMARY KEY,
  class_id VARCHAR(100) NOT NULL,
  day VARCHAR(20) NOT NULL, -- 'Monday', 'Tuesday', etc.
  period VARCHAR(50) NOT NULL, -- '1st Period', '2nd Period', etc.
  subject VARCHAR(100),
  teacher VARCHAR(100),
  room VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for timetable
ALTER TABLE timetable ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for timetable
DROP POLICY IF EXISTS "Allow all operations" ON timetable;
CREATE POLICY "Allow all operations" ON timetable
  FOR ALL USING (true);

-- Grant permissions for timetable
GRANT ALL ON timetable TO anon;
GRANT ALL ON timetable TO authenticated;
GRANT USAGE ON SEQUENCE timetable_id_seq TO anon;
GRANT USAGE ON SEQUENCE timetable_id_seq TO authenticated;

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  subject VARCHAR(100) NOT NULL,
  class_id VARCHAR(100) NOT NULL,
  teacher_id BIGINT NOT NULL,
  teacher_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for assignments
DROP POLICY IF EXISTS "Allow all operations" ON assignments;
CREATE POLICY "Allow all operations" ON assignments
  FOR ALL USING (true);

-- Grant permissions for assignments
GRANT ALL ON assignments TO anon;
GRANT ALL ON assignments TO authenticated;
GRANT USAGE ON SEQUENCE assignments_id_seq TO anon;
GRANT USAGE ON SEQUENCE assignments_id_seq TO authenticated;