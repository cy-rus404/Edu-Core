-- Drop table if exists
DROP TABLE IF EXISTS students;

-- Create students table
CREATE TABLE students (
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

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON students
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON students TO anon;
GRANT ALL ON students TO authenticated;
GRANT USAGE ON SEQUENCE students_id_seq TO anon;
GRANT USAGE ON SEQUENCE students_id_seq TO authenticated;