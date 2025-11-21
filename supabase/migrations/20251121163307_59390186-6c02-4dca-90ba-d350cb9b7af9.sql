-- Create table for crafting recipes
CREATE TABLE public.crafting_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  result_item_name TEXT NOT NULL,
  result_item_type TEXT NOT NULL DEFAULT 'misc',
  result_quantity INTEGER NOT NULL DEFAULT 1,
  result_weight NUMERIC NOT NULL DEFAULT 0,
  required_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_skill TEXT,
  difficulty_dc INTEGER NOT NULL DEFAULT 10,
  crafting_time_minutes INTEGER NOT NULL DEFAULT 60,
  rarity TEXT NOT NULL DEFAULT 'common',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_rarity CHECK (rarity IN ('common', 'uncommon', 'rare', 'very_rare', 'legendary'))
);

-- Create table for merchant inventory
CREATE TABLE public.merchant_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'misc',
  description TEXT,
  base_price INTEGER NOT NULL,
  current_price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT -1,
  weight NUMERIC NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common',
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_merchant_rarity CHECK (rarity IN ('common', 'uncommon', 'rare', 'very_rare', 'legendary'))
);

-- Create table for transaction history
CREATE TABLE public.merchant_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  character_id UUID NOT NULL,
  merchant_item_id UUID,
  item_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('buy', 'sell'))
);

-- Enable RLS on crafting_recipes (public read)
ALTER TABLE public.crafting_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crafting recipes"
ON public.crafting_recipes
FOR SELECT
USING (true);

-- Enable RLS on merchant_items
ALTER TABLE public.merchant_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view merchant items in their room"
ON public.merchant_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_players
    WHERE room_players.room_id = merchant_items.room_id
    AND room_players.user_id = auth.uid()
  )
);

CREATE POLICY "GM can manage merchant items in their room"
ON public.merchant_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM rooms
    WHERE rooms.id = merchant_items.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- Enable RLS on merchant_transactions
ALTER TABLE public.merchant_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their own transactions"
ON public.merchant_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = merchant_transactions.character_id
    AND characters.user_id = auth.uid()
  )
);

CREATE POLICY "Players can create transactions for their characters"
ON public.merchant_transactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters
    WHERE characters.id = merchant_transactions.character_id
    AND characters.user_id = auth.uid()
  )
);

-- Insert some default crafting recipes
INSERT INTO public.crafting_recipes (name, description, result_item_name, result_item_type, result_quantity, result_weight, required_items, difficulty_dc, rarity) VALUES
('Poção de Cura Menor', 'Combine ervas medicinais para criar uma poção que restaura 2d4+2 HP', 'Poção de Cura Menor', 'potion', 1, 0.5, '[{"name": "Ervas Medicinais", "quantity": 2}, {"name": "Frasco Vazio", "quantity": 1}]'::jsonb, 10, 'common'),
('Espada Longa +1', 'Forje uma espada longa aprimorada com técnicas especiais', 'Espada Longa +1', 'weapon', 1, 3, '[{"name": "Espada Longa", "quantity": 1}, {"name": "Lingote de Mithral", "quantity": 1}, {"name": "Gema Encantada", "quantity": 1}]'::jsonb, 15, 'uncommon'),
('Armadura de Couro +1', 'Reforce uma armadura de couro com materiais mágicos', 'Armadura de Couro +1', 'armor', 1, 10, '[{"name": "Armadura de Couro", "quantity": 1}, {"name": "Couro de Dragão", "quantity": 2}]'::jsonb, 13, 'uncommon'),
('Bomba de Fogo', 'Combine ingredientes alquímicos para criar uma bomba explosiva (3d6 dano de fogo)', 'Bomba de Fogo', 'misc', 1, 1, '[{"name": "Pólvora Alquímica", "quantity": 1}, {"name": "Óleo Inflamável", "quantity": 1}, {"name": "Frasco Reforçado", "quantity": 1}]'::jsonb, 12, 'uncommon'),
('Poção de Cura Superior', 'Uma poção poderosa que restaura 4d4+4 HP', 'Poção de Cura Superior', 'potion', 1, 0.5, '[{"name": "Poção de Cura Menor", "quantity": 2}, {"name": "Essência Arcana", "quantity": 1}]'::jsonb, 15, 'rare');

-- Add indexes
CREATE INDEX idx_merchant_items_room ON public.merchant_items(room_id);
CREATE INDEX idx_merchant_transactions_character ON public.merchant_transactions(character_id);
CREATE INDEX idx_merchant_transactions_room ON public.merchant_transactions(room_id);