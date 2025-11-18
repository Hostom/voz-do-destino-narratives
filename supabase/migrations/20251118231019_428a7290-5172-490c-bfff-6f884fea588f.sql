-- Create rooms table
CREATE TABLE public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code text NOT NULL UNIQUE,
  gm_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  combat_active boolean NOT NULL DEFAULT false,
  current_turn integer DEFAULT 0,
  initiative_order jsonb DEFAULT '[]'::jsonb
);

-- Enable RLS on rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Policies for rooms
CREATE POLICY "Anyone can view rooms"
ON public.rooms FOR SELECT
USING (true);

CREATE POLICY "GM can create rooms"
ON public.rooms FOR INSERT
WITH CHECK (auth.uid() = gm_id);

CREATE POLICY "GM can update their rooms"
ON public.rooms FOR UPDATE
USING (auth.uid() = gm_id);

CREATE POLICY "GM can delete their rooms"
ON public.rooms FOR DELETE
USING (auth.uid() = gm_id);

-- Create room_players table (links players to rooms)
CREATE TABLE public.room_players (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  is_ready boolean NOT NULL DEFAULT false,
  initiative integer DEFAULT 0,
  UNIQUE(room_id, character_id)
);

-- Enable RLS on room_players
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;

-- Policies for room_players
CREATE POLICY "Anyone can view room players"
ON public.room_players FOR SELECT
USING (true);

CREATE POLICY "Users can join rooms with their characters"
ON public.room_players FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own room player status"
ON public.room_players FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
ON public.room_players FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;

-- Function to generate unique 6-digit room code
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 6-digit code
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.rooms WHERE room_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;