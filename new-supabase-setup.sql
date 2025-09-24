-- Create students table
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  dob VARCHAR(50),
  mother_name VARCHAR(255),
  mother_contact VARCHAR(50),
  father_name VARCHAR(255),
  father_contact VARCHAR(50),
  class VARCHAR(50),
  email VARCHAR(255) UNIQUE,
  gender VARCHAR(10),
  student_id VARCHAR(50) UNIQUE,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create teachers table
CREATE TABLE teachers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER,
  subject VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  gender VARCHAR(10),
  assigned_class VARCHAR(50),
  teacher_id VARCHAR(50) UNIQUE,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target_audience VARCHAR(50) NOT NULL,
  created_by VARCHAR(255),
  read_by JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER,
  sender_type VARCHAR(20),
  receiver_id INTEGER,
  receiver_type VARCHAR(20),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies (basic - adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON teachers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON announcements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users" ON messages FOR ALL USING (auth.role() = 'authenticated');