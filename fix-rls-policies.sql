-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON students;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON teachers;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON announcements;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON messages;

-- Create permissive policies that allow all operations
CREATE POLICY "Allow all operations" ON students FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON announcements FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON messages FOR ALL USING (true);