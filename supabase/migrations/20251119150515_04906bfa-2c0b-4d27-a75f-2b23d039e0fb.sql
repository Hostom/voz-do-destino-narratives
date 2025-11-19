-- Fix infinite recursion in RLS policies by simplifying them

-- 1. Fix room_players table - remove self-referencing policy
DROP POLICY IF EXISTS "Authenticated users can view room players" ON public.room_players;

CREATE POLICY "Users can view room players in their rooms" ON public.room_players
  FOR SELECT
  TO authenticated
  USING (
    -- User can see their own player record
    auth.uid() = user_id
    OR 
    -- GM can see all players in their rooms
    EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_players.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

-- 2. Fix rooms table - simplify to avoid circular dependency
DROP POLICY IF EXISTS "Users can view their rooms" ON public.rooms;

CREATE POLICY "Users can view rooms they are GM of" ON public.rooms
  FOR SELECT
  TO authenticated
  USING (auth.uid() = gm_id);

-- 3. Add separate policy for players to view their rooms
CREATE POLICY "Players can view rooms they joined" ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = rooms.id
      AND room_players.user_id = auth.uid()
    )
  );