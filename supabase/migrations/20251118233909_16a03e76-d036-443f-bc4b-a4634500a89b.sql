-- Add hit dice fields to characters table for rest system
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS hit_dice TEXT DEFAULT '1d8',
ADD COLUMN IF NOT EXISTS current_hit_dice INTEGER DEFAULT 1;