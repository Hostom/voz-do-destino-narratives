-- Adicionar campo para identificar mensagens narrativas do GM
ALTER TABLE room_chat_messages
ADD COLUMN is_narrative boolean DEFAULT false;

-- Criar índice para melhorar performance
CREATE INDEX idx_room_chat_messages_narrative ON room_chat_messages(room_id, is_narrative) WHERE is_narrative = true;