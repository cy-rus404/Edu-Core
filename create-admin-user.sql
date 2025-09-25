-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert admin user (you can change the email)
INSERT INTO admin_users (email, name) VALUES 
('admin@educore.com', 'System Administrator')
ON CONFLICT (email) DO NOTHING;

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users
CREATE POLICY "Allow all operations" ON admin_users FOR ALL USING (true);