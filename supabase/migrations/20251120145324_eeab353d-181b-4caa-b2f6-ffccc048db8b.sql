-- Criar tabela para reações em tempo real
CREATE TABLE public.player_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  character_name TEXT NOT NULL,
  reaction_type TEXT NOT NULL, -- 'emoji', 'quick_text', 'action'
  reaction_content TEXT NOT NULL,
  target_message_id UUID, -- Optional: reference to a gm_message
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 seconds')
);

-- Enable RLS
ALTER TABLE public.player_reactions ENABLE ROW LEVEL SECURITY;

-- Players can create reactions in their room
CREATE POLICY "Players can create reactions in their room"
ON public.player_reactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_players.room_id = player_reactions.room_id
    AND room_players.user_id = auth.uid()
  )
);

-- Anyone in room can view reactions
CREATE POLICY "Anyone in room can view reactions"
ON public.player_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_players.room_id = player_reactions.room_id
    AND room_players.user_id = auth.uid()
  )
);

-- Players can delete their own reactions
CREATE POLICY "Players can delete their own reactions"
ON public.player_reactions
FOR DELETE
USING (auth.uid() = player_id);

-- Índices para performance
CREATE INDEX idx_player_reactions_room_id ON public.player_reactions(room_id);
CREATE INDEX idx_player_reactions_created_at ON public.player_reactions(created_at DESC);
CREATE INDEX idx_player_reactions_expires_at ON public.player_reactions(expires_at);

-- Função para limpar reações expiradas automaticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_reactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.player_reactions
  WHERE expires_at < now();
END;
$$;