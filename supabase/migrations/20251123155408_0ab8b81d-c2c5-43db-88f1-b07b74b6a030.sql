-- Create loot_checks table for tracking loot attempts
CREATE TABLE public.loot_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL,
  npc_id uuid NOT NULL,
  npc_name text NOT NULL,
  character_id uuid NOT NULL,
  check_result integer NOT NULL,
  dc integer NOT NULL,
  success boolean NOT NULL,
  item_name text NOT NULL,
  item_type text NOT NULL DEFAULT 'misc',
  item_description text,
  quantity integer NOT NULL DEFAULT 1,
  weight numeric NOT NULL DEFAULT 0,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loot_checks ENABLE ROW LEVEL SECURITY;

-- GM can view all loot checks in their room
CREATE POLICY "GM can view loot checks in their room"
ON public.loot_checks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = loot_checks.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- Players can view their own loot checks
CREATE POLICY "Players can view their own loot checks"
ON public.loot_checks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = loot_checks.character_id
    AND characters.user_id = auth.uid()
  )
);

-- Players can create loot checks for their characters
CREATE POLICY "Players can create loot checks"
ON public.loot_checks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = loot_checks.character_id
    AND characters.user_id = auth.uid()
  )
);

-- Create loot_requests table for GM to request loot checks
CREATE TABLE public.loot_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL,
  npc_id uuid NOT NULL,
  npc_name text NOT NULL,
  target_character_id uuid NOT NULL,
  dc integer NOT NULL,
  item_name text NOT NULL,
  item_type text NOT NULL DEFAULT 'misc',
  item_description text,
  quantity integer NOT NULL DEFAULT 1,
  weight numeric NOT NULL DEFAULT 0,
  properties jsonb DEFAULT '{}'::jsonb,
  completed boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '5 minutes')
);

-- Enable RLS
ALTER TABLE public.loot_requests ENABLE ROW LEVEL SECURITY;

-- GM can create loot requests
CREATE POLICY "GM can create loot requests"
ON public.loot_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = loot_requests.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- GM can view loot requests in their room
CREATE POLICY "GM can view loot requests in their room"
ON public.loot_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = loot_requests.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- GM can update loot requests
CREATE POLICY "GM can update loot requests"
ON public.loot_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = loot_requests.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- Players can view their loot requests
CREATE POLICY "Players can view their loot requests"
ON public.loot_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = loot_requests.target_character_id
    AND characters.user_id = auth.uid()
  )
);

-- Enable realtime for loot_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.loot_requests;