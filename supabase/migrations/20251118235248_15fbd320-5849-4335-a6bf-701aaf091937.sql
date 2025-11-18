-- Add currency fields to characters table
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS copper_pieces integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS silver_pieces integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS electrum_pieces integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS gold_pieces integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS platinum_pieces integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS carrying_capacity integer DEFAULT 150;

-- Create character_items table for inventory
CREATE TABLE IF NOT EXISTS public.character_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  item_type text NOT NULL DEFAULT 'misc',
  quantity integer NOT NULL DEFAULT 1,
  weight numeric(10,2) NOT NULL DEFAULT 0,
  description text,
  properties jsonb DEFAULT '{}'::jsonb,
  equipped boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.character_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for character_items
CREATE POLICY "Users can view their own character items"
  ON public.character_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = character_items.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items for their characters"
  ON public.character_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = character_items.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own character items"
  ON public.character_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = character_items.character_id
      AND characters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own character items"
  ON public.character_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = character_items.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_character_items_updated_at
  BEFORE UPDATE ON public.character_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_characters_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.character_items;