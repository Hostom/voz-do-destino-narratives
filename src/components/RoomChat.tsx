import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/hooks/useCollection";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface GMMessage {
  id: string;
  player_id: string;
  sender: "player" | "GM";
  content: string;
  character_name: string;
  created_at: string;
  type: "gm";
}

interface TypingUser {
  character_name: string;
  user_id: string;
}

interface RoomChatProps {
  roomId: string;
  characterName: string;
  currentTurn: number;
  initiativeOrder: any[];
  isGM?: boolean;
}

export const RoomChat = ({ roomId, characterName, currentTurn, initiativeOrder, isGM = false }: RoomChatProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isNarrative, setIsNarrative] = useState(false);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

  // Use gm_messages as single source of truth - shows all GM narrations and player messages
  const { data: gmMessages, loading: messagesLoading } = useCollection<GMMessage>("gm_messages", {
    roomId,
    orderBy: "created_at",
    ascending: true,
  });

  const isMyTurn = initiativeOrder[currentTurn]?.character_name === characterName;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [gmMessages]);

  // Configurar presence para typing indicators
  useEffect(() => {
    const channel = supabase.channel(`room-chat-presence:${roomId}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing: TypingUser[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            if (presence.typing) {
              typing.push({
                character_name: presence.character_name,
                user_id: presence.user_id,
              });
            }
          });
        });

        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await channel.track({
              user_id: user.id,
              character_name: characterName,
              typing: false,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, characterName]);

  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user && channelRef.current) {
        await channelRef.current.track({
          user_id: user.id,
          character_name: characterName,
          typing: true,
          online_at: new Date().toISOString(),
        });
      }
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      setIsTyping(false);
      const { data: { user } } = await supabase.auth.getUser();
      if (user && channelRef.current) {
        await channelRef.current.track({
          user_id: user.id,
          character_name: characterName,
          typing: false,
          online_at: new Date().toISOString(),
        });
      }
    }, 2000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para enviar mensagens",
        variant: "destructive",
      });
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage("");

    // Se for narrativa do GM, apenas salvar sem chamar IA
    if (isNarrative && isGM) {
      const { error } = await supabase.from("gm_messages" as any).insert({
        room_id: roomId,
        player_id: user.id,
        sender: "GM",
        character_name: characterName,
        content: messageContent,
        type: "gm",
      } as any);

      if (error) {
        console.error("Error sending GM narrative:", error);
        toast({
          title: "Erro",
          description: "Não foi possível enviar a mensagem",
          variant: "destructive",
        });
        setNewMessage(messageContent);
        return;
      }
    } else {
      // Para mensagens de players, salvar em gm_messages primeiro
      const { error: insertError } = await supabase.from("gm_messages" as any).insert({
        room_id: roomId,
        player_id: user.id,
        sender: "player",
        character_name: characterName,
        content: messageContent,
        type: "gm",
      } as any);

      if (insertError) {
        console.error("Error sending player message:", insertError);
        toast({
          title: "Erro",
          description: "Não foi possível enviar a mensagem",
          variant: "destructive",
        });
        setNewMessage(messageContent);
        return;
      }

      // Then trigger masterNarrate (server-side action)
      // The server will save the GM response to gm_messages, maintaining context
      setIsAIResponding(true);
      try {
        await supabase.functions.invoke('game-master', {
          body: {
            messages: [{ role: 'user', content: messageContent }],
            roomId,
            characterName: characterName,
          },
        });
      } catch (error) {
        console.error('Error calling game master:', error);
        toast({
          title: "Erro",
          description: "Falha ao obter resposta da IA",
          variant: "destructive",
        });
      } finally {
        setIsAIResponding(false);
      }
    }

    setIsNarrative(false);
    setIsTyping(false);
    
    if (channelRef.current) {
      await channelRef.current.track({
        user_id: user.id,
        character_name: characterName,
        typing: false,
        online_at: new Date().toISOString(),
      });
    }
  };

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur border-primary/20">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5" />
          Aventura em Grupo
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          A IA Mestre narra a história - Todos os jogadores interagem aqui em tempo real
        </p>
        {initiativeOrder.length > 0 && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Turno de: </span>
            <span className="font-semibold text-primary">{initiativeOrder[currentTurn]?.character_name || 'Aguardando'}</span>
            {isMyTurn && <span className="ml-2 text-xs text-accent">(Sua vez!)</span>}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 p-4 overflow-hidden min-h-0">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {messagesLoading && gmMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-4">
                Carregando mensagens...
              </div>
            )}
            {gmMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-3 animate-in slide-in-from-bottom-2 ${
                  msg.sender === "GM"
                    ? "bg-gradient-to-r from-primary/20 to-accent/20 border-l-4 border-primary"
                    : "bg-secondary/50"
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  {msg.sender === "GM" && (
                    <span className="text-xs font-bold text-primary">🎭 MESTRE</span>
                  )}
                  <span className={`font-semibold text-sm ${msg.sender === "GM" ? "text-primary" : "text-foreground"}`}>
                    {msg.character_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className={`text-sm ${msg.sender === "GM" ? "font-medium text-foreground" : "text-foreground"}`}>
                  {msg.content}
                </p>
              </div>
            ))}
            
            {typingUsers.length > 0 && (
              <div className="text-sm text-muted-foreground italic">
                {typingUsers.map((u) => u.character_name).join(", ")}{" "}
                {typingUsers.length === 1 ? "está" : "estão"} digitando...
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="space-y-2">
          {isGM && (
            <div className="flex items-center gap-2 text-xs">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNarrative}
                  onChange={(e) => setIsNarrative(e.target.checked)}
                  className="rounded"
                />
                <span className="text-muted-foreground">Mensagem Narrativa</span>
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder={
                isGM && isNarrative
                  ? "Escreva uma narração épica..."
                  : "Digite sua ação ou pergunta para o Mestre..."
              }
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim() || isAIResponding}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
