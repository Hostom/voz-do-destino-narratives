-- Criar tabela para rodadas de ação
CREATE TABLE public.action_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  prompt TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  round_number INTEGER NOT NULL DEFAULT 1,
  use_initiative_order BOOLEAN NOT NULL DEFAULT true
);

-- Criar tabela para ações dos jogadores
CREATE TABLE public.player_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_round_id UUID NOT NULL REFERENCES public.action_rounds(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  action_text TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  initiative INTEGER
);

-- Enable RLS
ALTER TABLE public.action_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para action_rounds
CREATE POLICY "GM can create action rounds in their room"
ON public.action_rounds
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE rooms.id = action_rounds.room_id
    AND rooms.gm_id = auth.uid()
  )
);

CREATE POLICY "GM can update action rounds in their room"
ON public.action_rounds
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    WHERE rooms.id = action_rounds.room_id
    AND rooms.gm_id = auth.uid()
  )
);

CREATE POLICY "Players can view action rounds in their room"
ON public.action_rounds
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.room_players
    WHERE room_players.room_id = action_rounds.room_id
    AND room_players.user_id = auth.uid()
  )
);

-- RLS Policies para player_actions
CREATE POLICY "Players can create their own actions"
ON public.player_actions
FOR INSERT
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can view actions in their round"
ON public.player_actions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.action_rounds ar
    JOIN public.room_players rp ON rp.room_id = ar.room_id
    WHERE ar.id = player_actions.action_round_id
    AND rp.user_id = auth.uid()
  )
);

CREATE POLICY "GM can view all actions in their room rounds"
ON public.player_actions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.action_rounds ar
    JOIN public.rooms r ON r.id = ar.room_id
    WHERE ar.id = player_actions.action_round_id
    AND r.gm_id = auth.uid()
  )
);

-- Índices para performance
CREATE INDEX idx_action_rounds_room_id ON public.action_rounds(room_id);
CREATE INDEX idx_action_rounds_completed ON public.action_rounds(completed);
CREATE INDEX idx_player_actions_round_id ON public.player_actions(action_round_id);
CREATE INDEX idx_player_actions_character_id ON public.player_actions(character_id);