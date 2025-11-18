-- Create ability_checks table for tests and saving throws
CREATE TABLE IF NOT EXISTS public.ability_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  npc_id uuid REFERENCES public.npcs(id) ON DELETE CASCADE,
  character_name text NOT NULL,
  check_type text NOT NULL, -- 'ability', 'saving_throw', 'skill'
  ability text NOT NULL, -- 'strength', 'dexterity', etc.
  dc integer,
  roll_result integer NOT NULL,
  modifier integer NOT NULL,
  total integer NOT NULL,
  advantage boolean DEFAULT false,
  disadvantage boolean DEFAULT false,
  is_secret boolean DEFAULT false,
  success boolean,
  description text,
  requested_by_gm boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT check_character_or_npc CHECK (
    (character_id IS NOT NULL AND npc_id IS NULL) OR
    (character_id IS NULL AND npc_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.ability_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view non-secret checks in their room"
  ON public.ability_checks FOR SELECT
  USING (
    NOT is_secret AND EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = ability_checks.room_id
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "GM can view all checks in their room"
  ON public.ability_checks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = ability_checks.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

CREATE POLICY "Players can create checks in their room"
  ON public.ability_checks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = ability_checks.room_id
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "GM can create checks in their room"
  ON public.ability_checks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = ability_checks.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

-- Create check_requests table for GM to request checks from players
CREATE TABLE IF NOT EXISTS public.check_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  target_character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  target_all boolean DEFAULT false,
  check_type text NOT NULL,
  ability text NOT NULL,
  dc integer NOT NULL,
  description text,
  created_by uuid NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '5 minutes')
);

-- Enable RLS
ALTER TABLE public.check_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for check_requests
CREATE POLICY "Anyone can view check requests in their room"
  ON public.check_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = check_requests.room_id
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "GM can create check requests"
  ON public.check_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = check_requests.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

CREATE POLICY "GM can update check requests"
  ON public.check_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = check_requests.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ability_checks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_requests;