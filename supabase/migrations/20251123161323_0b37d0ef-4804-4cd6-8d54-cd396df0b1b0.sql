-- Create loot_tables for random loot generation based on creature type and rarity
CREATE TABLE public.loot_tables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creature_type text NOT NULL,
  rarity text NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'very_rare', 'legendary')),
  item_name text NOT NULL,
  item_type text NOT NULL DEFAULT 'misc',
  item_description text,
  weight numeric NOT NULL DEFAULT 0,
  properties jsonb DEFAULT '{}'::jsonb,
  drop_chance integer NOT NULL DEFAULT 100 CHECK (drop_chance >= 1 AND drop_chance <= 100),
  min_quantity integer NOT NULL DEFAULT 1,
  max_quantity integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loot_tables ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view loot tables
CREATE POLICY "Authenticated users can view loot tables"
ON public.loot_tables
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create interactive_objects table for chests, crates, etc.
CREATE TABLE public.interactive_objects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL,
  object_type text NOT NULL CHECK (object_type IN ('chest', 'crate', 'barrel', 'corpse', 'altar', 'custom')),
  name text NOT NULL,
  description text,
  dc integer NOT NULL DEFAULT 12,
  item_name text NOT NULL,
  item_type text NOT NULL DEFAULT 'misc',
  item_description text,
  quantity integer NOT NULL DEFAULT 1,
  weight numeric NOT NULL DEFAULT 0,
  properties jsonb DEFAULT '{}'::jsonb,
  looted boolean DEFAULT false,
  looted_by_character_id uuid,
  looted_at timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interactive_objects ENABLE ROW LEVEL SECURITY;

-- GM can create interactive objects in their room
CREATE POLICY "GM can create interactive objects"
ON public.interactive_objects
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = interactive_objects.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- GM can update interactive objects in their room
CREATE POLICY "GM can update interactive objects"
ON public.interactive_objects
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = interactive_objects.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- GM can delete interactive objects in their room
CREATE POLICY "GM can delete interactive objects"
ON public.interactive_objects
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = interactive_objects.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- Players can view interactive objects in their room
CREATE POLICY "Players can view interactive objects in their room"
ON public.interactive_objects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_players
    WHERE room_players.room_id = interactive_objects.room_id
    AND room_players.user_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.interactive_objects;