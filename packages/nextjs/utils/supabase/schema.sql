-- Supabase SQL Schema for ArkAnon

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registry_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  signal_hash TEXT NOT NULL,
  scope_hash TEXT NOT NULL,
  nullifier TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on registry_id for faster queries
CREATE INDEX IF NOT EXISTS posts_registry_id_idx ON posts(registry_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

-- Proposals Table
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registry_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  options JSONB NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on registry_id for faster queries
CREATE INDEX IF NOT EXISTS proposals_registry_id_idx ON proposals(registry_id);
CREATE INDEX IF NOT EXISTS proposals_created_at_idx ON proposals(created_at DESC);

-- Votes Table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  signal_hash TEXT NOT NULL,
  nullifier TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on proposal_id for faster queries
CREATE INDEX IF NOT EXISTS votes_proposal_id_idx ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS votes_created_at_idx ON votes(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (posts are anonymous anyway)
CREATE POLICY "Enable read access for all users" ON posts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON proposals FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON proposals FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON votes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON votes FOR INSERT WITH CHECK (true);

