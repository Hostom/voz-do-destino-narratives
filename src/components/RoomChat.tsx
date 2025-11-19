import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  user_id: string;
  character_name: string;
  message: string;
  created_at: string;
  is_narrative?: boolean;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isNarrative, setIsNarrative] = useState(false);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

  const isMyTurn = initiativeOrder[currentTurn]?.character_name === characterName;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar mensagens existentes do grupo
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("room_chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      if (data) {
        setMessages(data as unknown as ChatMessage[]);
      }
    };

    loadMessages();
  }, [roomId]);

  // Configurar realtime para mensagens e presence para typing indicators
  useEffect(() => {
    const channel = supabase.channel(`room-chat:${roomId}`);

    // Subscrever a novas mensagens
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Nova mensagem recebida em tempo real:", payload.new);
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing: TypingUser[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            if (presence.typing && presence.user_id !== supabase.auth.getUser().then(u => u.data.user?.id)) {
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

    const { error } = await supabase.from("room_chat_messages").insert({
      room_id: roomId,
      user_id: user.id,
      character_name: characterName,
      message: newMessage.trim(),
      is_narrative: isNarrative,
    });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
      return;
    }

    // Se não for narrativa do GM, chamar a IA para narrar
    if (!isNarrative || !isGM) {
      setIsAIResponding(true);
      try {
        await supabase.functions.invoke('game-master', {
          body: { 
            messages: [{ role: 'user', content: newMessage.trim() }],
            roomId,
            characterName: 'Mestre do Jogo'
          }
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

    setNewMessage("");
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="w-5 h-5" />
          Chat do Grupo (Social)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {isGM ? "Chat Principal - Narrativa da IA visível para todos" : "Chat Principal - Narrativa e ações dos jogadores"}
        </p>
        {initiativeOrder.length > 0 && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Turno de: </span>
            <span className="font-semibold text-primary">{initiativeOrder[currentTurn]?.character_name || 'Aguardando'}</span>
            {isMyTurn && <span className="ml-2 text-xs text-accent">(Sua vez!)</span>}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4 h-[400px]">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg p-3 animate-in slide-in-from-bottom-2 ${
                  msg.is_narrative
                    ? "bg-gradient-to-r from-primary/20 to-accent/20 border-l-4 border-primary"
                    : "bg-secondary/50"
                }`}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  {msg.is_narrative && (
                    <span className="text-xs font-bold text-primary">📜 NARRAÇÃO</span>
                  )}
                  <span className={`font-semibold text-sm ${msg.is_narrative ? "text-primary" : "text-primary"}`}>
                    {msg.character_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className={`text-sm ${msg.is_narrative ? "font-medium text-foreground" : "text-foreground"}`}>
                  {msg.message}
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
                isGM
                  ? (isNarrative ? "Escreva uma narração épica..." : "Digite sua mensagem para a IA...")
                  : "Digite sua ação..."
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
