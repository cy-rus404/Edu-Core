-- Create settings tables for admin configuration

-- School Information Table
CREATE TABLE IF NOT EXISTS school_settings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'School Name',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic Year Settings Table
CREATE TABLE IF NOT EXISTS academic_settings (
  id BIGSERIAL PRIMARY KEY,
  current_year TEXT NOT NULL DEFAULT '2023-2024',
  term_start DATE,
  term_end DATE,
  current_term TEXT DEFAULT 'First Term',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class Settings Table
CREATE TABLE IF NOT EXISTS class_settings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for all settings tables
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings tables (admin only access)
CREATE POLICY "Allow all operations for authenticated users" ON school_settings
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON academic_settings
FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON class_settings
FOR ALL USING (auth.role() = 'authenticated');

-- Insert default data
INSERT INTO school_settings (name, address, phone, email, website) 
VALUES ('EduCore School', '123 Education Street', '+1-234-567-8900', 'info@educore.com', 'www.educore.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academic_settings (current_year, current_term) 
VALUES ('2023-2024', 'First Term')
ON CONFLICT (id) DO NOTHING;

-- Insert default classes
INSERT INTO class_settings (name, capacity) VALUES
('Creche', 20),
('Nursery', 25),
('KG1', 30),
('KG2', 30),
('Class 1', 35),
('Class 2', 35),
('Class 3', 35),
('Class 4', 40),
('Class 5', 40),
('Class 6', 40),
('JHS 1', 45),
('JHS 2', 45),
('JHS 3', 45)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_settings_name ON class_settings(name);
CREATE INDEX IF NOT EXISTS idx_school_settings_updated ON school_settings(updated_at);
CREATE INDEX IF NOT EXISTS idx_academic_settings_updated ON academic_settings(updated_at);