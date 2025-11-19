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
}

interface TypingUser {
  character_name: string;
  user_id: string;
}

interface RoomChatProps {
  roomId: string;
  characterName: string;
  currentTurnCharacterName?: string | null;
  isUserTurn?: boolean;
  isGM?: boolean;
}

export const RoomChat = ({ roomId, characterName, currentTurnCharacterName, isUserTurn, isGM }: RoomChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar mensagens existentes
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
        setMessages(data);
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

    setNewMessage("");
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
          Chat do Grupo
        </CardTitle>
        {currentTurnCharacterName && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Turno de: </span>
            <span className="font-semibold text-primary">{currentTurnCharacterName}</span>
            {isUserTurn && <span className="ml-2 text-xs text-accent">(Sua vez!)</span>}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4 h-[400px]">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-secondary/50 rounded-lg p-3 animate-in slide-in-from-bottom-2"
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-primary text-sm">
                    {msg.character_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground">{msg.message}</p>
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

        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder={
              !isGM && currentTurnCharacterName && !isUserTurn
                ? `Aguarde o turno de ${currentTurnCharacterName}...`
                : "Digite sua mensagem..."
            }
            className="flex-1"
            disabled={!isGM && currentTurnCharacterName && !isUserTurn}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim() || (!isGM && currentTurnCharacterName && !isUserTurn)}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
