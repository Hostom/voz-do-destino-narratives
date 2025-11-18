-- Add combat fields to characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS proficiency_bonus integer NOT NULL DEFAULT 2,
ADD COLUMN IF NOT EXISTS spell_slots jsonb DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS current_spell_slots jsonb DEFAULT '{"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0}'::jsonb,
ADD COLUMN IF NOT EXISTS equipped_weapon jsonb DEFAULT '{"name": "Ataque Desarmado", "damage_dice": "1d4", "damage_type": "contundente", "ability": "strength"}'::jsonb,
ADD COLUMN IF NOT EXISTS saving_throws jsonb DEFAULT '{"strength": false, "dexterity": false, "constitution": false, "intelligence": false, "wisdom": false, "charisma": false}'::jsonb;

-- Add conditions to room_players
ALTER TABLE public.room_players
ADD COLUMN IF NOT EXISTS conditions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS temp_hp integer DEFAULT 0;

-- Create combat_log table
CREATE TABLE IF NOT EXISTS public.combat_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  round_number integer NOT NULL,
  character_name text NOT NULL,
  action_type text NOT NULL,
  target_name text,
  roll_result integer,
  damage integer,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on combat_log
ALTER TABLE public.combat_log ENABLE ROW LEVEL SECURITY;

-- Policies for combat_log
CREATE POLICY "Anyone can view combat logs in their room"
ON public.combat_log FOR SELECT
USING (true);

CREATE POLICY "Players can create combat logs in their room"
ON public.combat_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_players.room_id = combat_log.room_id
    AND room_players.user_id = auth.uid()
  )
);

-- Enable realtime for combat_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_log;

-- Function to calculate ability modifier
CREATE OR REPLACE FUNCTION public.calculate_modifier(ability_score integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN FLOOR((ability_score - 10) / 2.0);
END;
$$;