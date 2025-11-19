-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their rooms" ON public.rooms;

-- Create new policies that allow users to find rooms by code and view rooms they're in
CREATE POLICY "Users can view rooms by code or membership"
ON public.rooms
FOR SELECT
USING (
  auth.uid() = gm_id 
  OR user_is_in_room(id, auth.uid())
  OR auth.uid() IS NOT NULL  -- Allow authenticated users to search by room_code
);