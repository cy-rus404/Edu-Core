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