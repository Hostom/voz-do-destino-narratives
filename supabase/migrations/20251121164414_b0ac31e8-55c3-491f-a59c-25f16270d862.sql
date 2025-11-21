-- Add table to track bargaining attempts
CREATE TABLE public.merchant_bargains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  character_id UUID NOT NULL,
  merchant_item_id UUID NOT NULL,
  roll_result INTEGER NOT NULL,
  modifier INTEGER NOT NULL,
  total INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, character_id, merchant_item_id)
);

-- Enable RLS
ALTER TABLE public.merchant_bargains ENABLE ROW LEVEL SECURITY;

-- Players can view their own bargains
CREATE POLICY "Players can view their own bargains"
ON public.merchant_bargains
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = merchant_bargains.character_id
    AND characters.user_id = auth.uid()
  )
);

-- Players can create bargains for their characters
CREATE POLICY "Players can create bargains"
ON public.merchant_bargains
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = merchant_bargains.character_id
    AND characters.user_id = auth.uid()
  )
);

-- Add index
CREATE INDEX idx_merchant_bargains_character ON public.merchant_bargains(character_id, merchant_item_id);