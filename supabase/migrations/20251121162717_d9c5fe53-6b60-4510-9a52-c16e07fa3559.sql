-- Create table for tracking item rewards/loot distribution
CREATE TABLE public.item_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  character_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'misc',
  quantity INTEGER NOT NULL DEFAULT 1,
  weight NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  properties JSONB DEFAULT '{}'::jsonb,
  awarded_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  auto_added BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.item_rewards ENABLE ROW LEVEL SECURITY;

-- GM can award items in their room
CREATE POLICY "GM can award items in their room"
ON public.item_rewards
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = item_rewards.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- GM can view item rewards in their room
CREATE POLICY "GM can view item rewards in their room"
ON public.item_rewards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = item_rewards.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- Players can view their own item rewards
CREATE POLICY "Players can view their own item rewards"
ON public.item_rewards
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = item_rewards.character_id
    AND characters.user_id = auth.uid()
  )
);

-- Add index for better performance
CREATE INDEX idx_item_rewards_character ON public.item_rewards(character_id);
CREATE INDEX idx_item_rewards_room ON public.item_rewards(room_id);