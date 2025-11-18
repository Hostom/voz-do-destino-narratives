-- Create character sheets table for D&D 5E
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  race TEXT NOT NULL,
  class TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  
  -- D&D 5E Attributes
  strength INTEGER NOT NULL CHECK (strength >= 1 AND strength <= 20),
  dexterity INTEGER NOT NULL CHECK (dexterity >= 1 AND dexterity <= 20),
  constitution INTEGER NOT NULL CHECK (constitution >= 1 AND constitution <= 20),
  intelligence INTEGER NOT NULL CHECK (intelligence >= 1 AND intelligence <= 20),
  wisdom INTEGER NOT NULL CHECK (wisdom >= 1 AND wisdom <= 20),
  charisma INTEGER NOT NULL CHECK (charisma >= 1 AND charisma <= 20),
  
  -- Calculated stats
  max_hp INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  armor_class INTEGER NOT NULL DEFAULT 10,
  
  -- Background and description
  background TEXT,
  backstory TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own characters" 
ON public.characters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own characters" 
ON public.characters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters" 
ON public.characters 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters" 
ON public.characters 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_characters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_characters_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.update_characters_updated_at();