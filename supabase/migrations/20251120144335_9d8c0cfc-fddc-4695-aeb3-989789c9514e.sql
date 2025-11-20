-- Criar tabela para snapshots de sessões
CREATE TABLE public.session_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_data JSONB NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  combat_round INTEGER,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.session_snapshots ENABLE ROW LEVEL SECURITY;

-- GM pode criar snapshots em suas salas
CREATE POLICY "GM can create snapshots in their room"
ON public.session_snapshots
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE rooms.id = session_snapshots.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- GM pode visualizar snapshots de suas salas
CREATE POLICY "GM can view snapshots in their room"
ON public.session_snapshots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE rooms.id = session_snapshots.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- Jogadores podem visualizar snapshots das salas em que participam
CREATE POLICY "Players can view snapshots in their room"
ON public.session_snapshots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_players.room_id = session_snapshots.room_id
    AND room_players.user_id = auth.uid()
  )
);

-- GM pode deletar snapshots antigos
CREATE POLICY "GM can delete snapshots in their room"
ON public.session_snapshots
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE rooms.id = session_snapshots.room_id
    AND rooms.gm_id = auth.uid()
  )
);

-- Criar índice para melhor performance
CREATE INDEX idx_session_snapshots_room_id ON public.session_snapshots(room_id);
CREATE INDEX idx_session_snapshots_created_at ON public.session_snapshots(created_at DESC);