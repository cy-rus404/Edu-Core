-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  participant1_id VARCHAR(100) NOT NULL,
  participant1_name VARCHAR(255) NOT NULL,
  participant1_role VARCHAR(50) NOT NULL,
  participant2_id VARCHAR(100) NOT NULL,
  participant2_name VARCHAR(255) NOT NULL,
  participant2_role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for conversations
DROP POLICY IF EXISTS "Allow all operations" ON conversations;
CREATE POLICY "Allow all operations" ON conversations
  FOR ALL USING (true);

-- Grant permissions for conversations
GRANT ALL ON conversations TO anon;
GRANT ALL ON conversations TO authenticated;
GRANT USAGE ON SEQUENCE conversations_id_seq TO anon;
GRANT USAGE ON SEQUENCE conversations_id_seq TO authenticated;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(100) NOT NULL,
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for messages
DROP POLICY IF EXISTS "Allow all operations" ON messages;
CREATE POLICY "Allow all operations" ON messages
  FOR ALL USING (true);

-- Grant permissions for messages
GRANT ALL ON messages TO anon;
GRANT ALL ON messages TO authenticated;
GRANT USAGE ON SEQUENCE messages_id_seq TO anon;
GRANT USAGE ON SEQUENCE messages_id_seq TO authenticated;