import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scroll, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface GMChatProps {
  roomId: string;
  characterName: string;
  isGM?: boolean;
}

export const GMChat = ({ roomId, characterName, isGM }: GMChatProps) => {
  const [messages, setMessages] = useState<GMMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing GM messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("gm_messages" as any)
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading GM messages:", error);
        return;
      }

      if (data) {
        setMessages(data as GMMessage[]);
      }
    };

    loadMessages();
  }, [roomId]);

  // Setup realtime for GM messages
  useEffect(() => {
    const channel = supabase.channel(`gm-chat:${roomId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gm_messages" as any,
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as GMMessage]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

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

    const { error } = await supabase.from("gm_messages" as any).insert({
      room_id: roomId,
      player_id: user.id,
      sender: isGM ? "GM" : "player",
      character_name: characterName,
      content: newMessage.trim(),
      type: "gm",
    } as any);

    if (error) {
      console.error("Error sending GM message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
  };

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scroll className="w-5 h-5" />
          Chat do Mestre (Narrativa)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Canal narrativo - mensagens enviadas ao AI Game Master
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 p-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4 h-[400px]">
          <div className="space-y-3">
            {messages.map((msg) => (
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
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escreva sua ação para o Mestre..."
              className="flex-1"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
