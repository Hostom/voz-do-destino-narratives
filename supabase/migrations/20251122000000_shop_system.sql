-- Create shop_states table for persistent shop data
CREATE TABLE IF NOT EXISTS public.shop_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  npc_name TEXT NOT NULL DEFAULT 'Mercador',
  npc_personality TEXT NOT NULL DEFAULT 'neutral' CHECK (npc_personality IN ('friendly', 'neutral', 'hostile')),
  npc_reputation INTEGER NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id)
);

-- Create shop_transactions table for purchase history
CREATE TABLE IF NOT EXISTS public.shop_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shop_states
CREATE POLICY "Players can view shop states in their room"
  ON public.shop_states FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_players
      WHERE room_players.room_id = shop_states.room_id
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "GM can manage shop states in their room"
  ON public.shop_states FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = shop_states.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

-- RLS Policies for shop_transactions
CREATE POLICY "Players can view transactions in their room"
  ON public.shop_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_players
      WHERE room_players.room_id = shop_transactions.room_id
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "Players can create their own transactions"
  ON public.shop_transactions FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_states_room_id ON public.shop_states(room_id);
CREATE INDEX IF NOT EXISTS idx_shop_transactions_room_id ON public.shop_transactions(room_id);
CREATE INDEX IF NOT EXISTS idx_shop_transactions_player_id ON public.shop_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_shop_transactions_timestamp ON public.shop_transactions(timestamp);

-- Enable realtime for shop_states
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_states;

