-- Add inspiration field to characters table
ALTER TABLE public.characters 
ADD COLUMN inspiration BOOLEAN DEFAULT false NOT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN public.characters.inspiration IS 'Inspiration point that can be used to gain advantage on a roll (D&D 5e mechanic)';
