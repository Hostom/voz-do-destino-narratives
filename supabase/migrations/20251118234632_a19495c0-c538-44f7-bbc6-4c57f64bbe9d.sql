-- Create NPCs/Enemies table for GM to manage
CREATE TABLE IF NOT EXISTS public.npcs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  creature_type TEXT NOT NULL DEFAULT 'humanoid',
  max_hp INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  armor_class INTEGER NOT NULL DEFAULT 10,
  initiative_bonus INTEGER NOT NULL DEFAULT 0,
  initiative INTEGER DEFAULT 0,
  strength INTEGER NOT NULL DEFAULT 10,
  dexterity INTEGER NOT NULL DEFAULT 10,
  constitution INTEGER NOT NULL DEFAULT 10,
  intelligence INTEGER NOT NULL DEFAULT 10,
  wisdom INTEGER NOT NULL DEFAULT 10,
  charisma INTEGER NOT NULL DEFAULT 10,
  attack_bonus INTEGER NOT NULL DEFAULT 0,
  damage_dice TEXT NOT NULL DEFAULT '1d6',
  damage_type TEXT NOT NULL DEFAULT 'cortante',
  conditions JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view NPCs in their room"
  ON public.npcs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_players
      WHERE room_players.room_id = npcs.room_id
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "GM can insert NPCs in their room"
  ON public.npcs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = npcs.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

CREATE POLICY "GM can update NPCs in their room"
  ON public.npcs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = npcs.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

CREATE POLICY "GM can delete NPCs in their room"
  ON public.npcs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = npcs.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_npcs_updated_at
  BEFORE UPDATE ON public.npcs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_characters_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.npcs;