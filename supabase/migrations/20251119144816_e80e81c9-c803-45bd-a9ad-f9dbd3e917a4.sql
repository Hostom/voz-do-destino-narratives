-- Add experience points fields to characters table
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS experience_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_to_next_level integer DEFAULT 300;

-- Add experience rewards table for tracking XP distribution
CREATE TABLE IF NOT EXISTS experience_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  reason text,
  awarded_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE experience_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experience_rewards
CREATE POLICY "Players can view their own XP rewards"
  ON experience_rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = experience_rewards.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "GM can view XP rewards in their room"
  ON experience_rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = experience_rewards.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

CREATE POLICY "GM can award XP in their room"
  ON experience_rewards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = experience_rewards.room_id
      AND rooms.gm_id = auth.uid()
    )
  );