-- Create shop_states table for storing shop inventory per room
CREATE TABLE IF NOT EXISTS public.shop_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL UNIQUE REFERENCES public.rooms(id) ON DELETE CASCADE,
  npc_name TEXT NOT NULL DEFAULT 'Mercador',
  npc_personality TEXT NOT NULL DEFAULT 'neutral' CHECK (npc_personality IN ('friendly', 'neutral', 'hostile')),
  npc_reputation INTEGER NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shop_transactions table for tracking all purchases
CREATE TABLE IF NOT EXISTS public.shop_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on shop_states
ALTER TABLE public.shop_states ENABLE ROW LEVEL SECURITY;

-- Players can view shop in their room
CREATE POLICY "Players can view shop in their room"
ON public.shop_states
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_players.room_id = shop_states.room_id
    AND room_players.user_id = auth.uid()
  )
);

-- GM can manage shop in their room
CREATE POLICY "GM can manage shop in their room"
ON public.shop_states
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE rooms.id = shop_states.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- Enable RLS on shop_transactions
ALTER TABLE public.shop_transactions ENABLE ROW LEVEL SECURITY;

-- Players can view their own transactions
CREATE POLICY "Players can view their own transactions"
ON public.shop_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE characters.id = shop_transactions.character_id
    AND characters.user_id = auth.uid()
  )
);

-- Players can create transactions for their characters
CREATE POLICY "Players can create transactions"
ON public.shop_transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.characters
    WHERE characters.id = shop_transactions.character_id
    AND characters.user_id = auth.uid()
  )
);

-- GM can view all transactions in their room
CREATE POLICY "GM can view room transactions"
ON public.shop_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE rooms.id = shop_transactions.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shop_states_room_id ON public.shop_states(room_id);
CREATE INDEX IF NOT EXISTS idx_shop_transactions_room_id ON public.shop_transactions(room_id);
CREATE INDEX IF NOT EXISTS idx_shop_transactions_character_id ON public.shop_transactions(character_id);

-- Enable realtime for shop_states
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_states;