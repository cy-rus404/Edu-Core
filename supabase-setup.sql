-- Create students table if not exists
CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  dob VARCHAR(50),
  parents_name VARCHAR(255),
  class VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  gender VARCHAR(10),
  student_id VARCHAR(100),
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new parent contact columns
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS mother_contact VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS father_contact VARCHAR(50);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Allow all operations" ON students;
CREATE POLICY "Allow all operations" ON students
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON students TO anon;
GRANT ALL ON students TO authenticated;
GRANT USAGE ON SEQUENCE students_id_seq TO anon;
GRANT USAGE ON SEQUENCE students_id_seq TO authenticated;

-- Create teachers table if not exists
CREATE TABLE IF NOT EXISTS teachers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  subject VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  gender VARCHAR(10),
  teacher_id VARCHAR(100),
  assigned_class VARCHAR(100),
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add assigned class column if it doesn't exist
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS assigned_class VARCHAR(100);

-- Add assigned class column to teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS assigned_class VARCHAR(100);

-- Enable Row Level Security for teachers
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one for teachers
DROP POLICY IF EXISTS "Allow all operations" ON teachers;
CREATE POLICY "Allow all operations" ON teachers
  FOR ALL USING (true);

-- Grant permissions for teachers
GRANT ALL ON teachers TO anon;
GRANT ALL ON teachers TO authenticated;
GRANT USAGE ON SEQUENCE teachers_id_seq TO anon;
GRANT USAGE ON SEQUENCE teachers_id_seq TO authenticated;

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  student_id VARCHAR(100) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  class VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'late'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for attendance
DROP POLICY IF EXISTS "Allow all operations" ON attendance;
CREATE POLICY "Allow all operations" ON attendance
  FOR ALL USING (true);

-- Grant permissions for attendance
GRANT ALL ON attendance TO anon;
GRANT ALL ON attendance TO authenticated;
GRANT USAGE ON SEQUENCE attendance_id_seq TO anon;
GRANT USAGE ON SEQUENCE attendance_id_seq TO authenticated;

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
  id BIGSERIAL PRIMARY KEY,
  student_id VARCHAR(100) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  class VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  grade VARCHAR(2) NOT NULL,
  term VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for grades
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for grades
DROP POLICY IF EXISTS "Allow all operations" ON grades;
CREATE POLICY "Allow all operations" ON grades
  FOR ALL USING (true);

-- Grant permissions for grades
GRANT ALL ON grades TO anon;
GRANT ALL ON grades TO authenticated;
GRANT USAGE ON SEQUENCE grades_id_seq TO anon;
GRANT USAGE ON SEQUENCE grades_id_seq TO authenticated;

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  recipients VARCHAR(50) NOT NULL, -- 'students', 'teachers', 'all'
  sender VARCHAR(50) NOT NULL,
  read_by JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update announcements table to remove columns if they exist
ALTER TABLE announcements DROP COLUMN IF EXISTS specific_recipient;
ALTER TABLE announcements DROP COLUMN IF EXISTS can_reply;
ALTER TABLE announcements DROP COLUMN IF EXISTS sender_id;
ALTER TABLE announcements DROP COLUMN IF EXISTS parent_id;

-- Enable Row Level Security for announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for announcements
DROP POLICY IF EXISTS "Allow all operations" ON announcements;
CREATE POLICY "Allow all operations" ON announcements
  FOR ALL USING (true);

-- Grant permissions for announcements
GRANT ALL ON announcements TO anon;
GRANT ALL ON announcements TO authenticated;
GRANT USAGE ON SEQUENCE announcements_id_seq TO anon;
GRANT USAGE ON SEQUENCE announcements_id_seq TO authenticated;

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