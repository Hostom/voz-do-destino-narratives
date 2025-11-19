-- Fix infinite recursion by using security definer function

-- Create function to check if user is in a room (breaks recursion)
CREATE OR REPLACE FUNCTION public.user_is_in_room(room_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM room_players
    WHERE room_id = room_uuid
    AND user_id = user_uuid
  );
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view rooms they are GM of" ON public.rooms;
DROP POLICY IF EXISTS "Players can view rooms they joined" ON public.rooms;

-- Create single policy using the function
CREATE POLICY "Users can view their rooms" ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = gm_id 
    OR public.user_is_in_room(id, auth.uid())
  );