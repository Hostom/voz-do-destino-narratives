-- Fix error-level security issues by requiring authentication for RLS policies

-- 1. Fix rooms table - require users to be GM or room member
DROP POLICY IF EXISTS "Anyone can view rooms" ON public.rooms;

CREATE POLICY "Users can view their rooms" ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = gm_id 
    OR EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_players.room_id = rooms.id 
      AND room_players.user_id = auth.uid()
    )
  );

-- 2. Fix room_players table - require authentication and room membership
DROP POLICY IF EXISTS "Anyone can view room players" ON public.room_players;

CREATE POLICY "Authenticated users can view room players" ON public.room_players
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players rp
      WHERE rp.room_id = room_players.room_id
      AND rp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = room_players.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

-- 3. Fix combat_log table - require room membership
DROP POLICY IF EXISTS "Anyone can view combat logs in their room" ON public.combat_log;

CREATE POLICY "Room members can view combat logs" ON public.combat_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = combat_log.room_id
      AND room_players.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = combat_log.room_id
      AND rooms.gm_id = auth.uid()
    )
  );