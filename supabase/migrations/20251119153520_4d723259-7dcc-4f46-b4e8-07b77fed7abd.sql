-- Permitir que o GM veja as fichas dos jogadores na sala dele
CREATE POLICY "GM can view player characters in their room" ON public.characters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM room_players rp
      JOIN rooms r ON r.id = rp.room_id
      WHERE rp.character_id = characters.id
      AND r.gm_id = auth.uid()
    )
  );