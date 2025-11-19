-- Create gm_messages table for Game Master narrative chat
CREATE TABLE IF NOT EXISTS public.gm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  sender text NOT NULL CHECK (sender IN ('player', 'GM')),
  character_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL DEFAULT 'gm'
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gm_messages_room_id ON public.gm_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_gm_messages_created_at ON public.gm_messages(created_at);

-- Enable RLS
ALTER TABLE public.gm_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gm_messages
CREATE POLICY "Players can view GM messages in their room"
  ON public.gm_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_players
      WHERE room_players.room_id = gm_messages.room_id
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Players can insert GM messages in their room"
  ON public.gm_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_players
      WHERE room_players.room_id = gm_messages.room_id
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "GM can view all messages in their room"
  ON public.gm_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = gm_messages.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

CREATE POLICY "GM can insert messages in their room"
  ON public.gm_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = gm_messages.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

-- Enable realtime for gm_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.gm_messages;