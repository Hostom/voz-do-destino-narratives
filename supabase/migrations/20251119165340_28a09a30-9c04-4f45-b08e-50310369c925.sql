-- Add session_active field to rooms table to track when session starts
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS session_active BOOLEAN NOT NULL DEFAULT false;