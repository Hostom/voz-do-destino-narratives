-- Fix function search path for generate_room_code
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 6-digit code
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.rooms WHERE room_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;