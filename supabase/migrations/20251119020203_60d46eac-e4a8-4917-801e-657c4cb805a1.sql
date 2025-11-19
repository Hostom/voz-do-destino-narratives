-- Criar tabela para mensagens do chat da sala
CREATE TABLE public.room_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  user_id UUID NOT NULL,
  character_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.room_chat_messages ENABLE ROW LEVEL SECURITY;

-- Política para visualizar mensagens da sala
CREATE POLICY "Anyone can view messages in their room"
ON public.room_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_players
    WHERE room_players.room_id = room_chat_messages.room_id
    AND room_players.user_id = auth.uid()
  )
);

-- Política para enviar mensagens
CREATE POLICY "Players can send messages in their room"
ON public.room_chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM room_players
    WHERE room_players.room_id = room_chat_messages.room_id
    AND room_players.user_id = auth.uid()
  )
);

-- Adicionar foreign key
ALTER TABLE public.room_chat_messages
ADD CONSTRAINT room_chat_messages_room_id_fkey
FOREIGN KEY (room_id)
REFERENCES public.rooms(id)
ON DELETE CASCADE;

-- Adicionar índices para melhor performance
CREATE INDEX idx_room_chat_messages_room_id ON public.room_chat_messages(room_id);
CREATE INDEX idx_room_chat_messages_created_at ON public.room_chat_messages(created_at DESC);

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_chat_messages;