-- Create table for item trades between players
CREATE TABLE public.item_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  from_character_id UUID NOT NULL,
  to_character_id UUID NOT NULL,
  item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.item_trades ENABLE ROW LEVEL SECURITY;

-- Players can create trade offers for their items
CREATE POLICY "Players can create trade offers"
ON public.item_trades
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = item_trades.from_character_id
    AND characters.user_id = auth.uid()
  )
);

-- Players can view trades involving their characters
CREATE POLICY "Players can view their trades"
ON public.item_trades
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM characters
    WHERE (characters.id = item_trades.from_character_id 
           OR characters.id = item_trades.to_character_id)
    AND characters.user_id = auth.uid()
  )
);

-- Players can update trades they received (accept/reject)
CREATE POLICY "Players can update received trades"
ON public.item_trades
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = item_trades.to_character_id
    AND characters.user_id = auth.uid()
  )
);

-- Players can cancel their own trade offers
CREATE POLICY "Players can cancel their trades"
ON public.item_trades
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = item_trades.from_character_id
    AND characters.user_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX idx_item_trades_from_character ON public.item_trades(from_character_id);
CREATE INDEX idx_item_trades_to_character ON public.item_trades(to_character_id);
CREATE INDEX idx_item_trades_room ON public.item_trades(room_id);
CREATE INDEX idx_item_trades_status ON public.item_trades(status);