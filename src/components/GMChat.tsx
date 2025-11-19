import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scroll, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/hooks/useCollection";

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
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use useCollection hook - single source of truth for gm_messages
  const { data: messages, loading } = useCollection<GMMessage>("gm_messages", {
    roomId,
    orderBy: "created_at",
    ascending: true,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // ALWAYS save player message to gm_messages first
    const { error: insertError } = await supabase.from("gm_messages" as any).insert({
      room_id: roomId,
      player_id: user.id,
      sender: "player",
      character_name: characterName,
      content: messageContent,
      type: "gm",
    } as any);

    if (insertError) {
      console.error("Error sending GM message:", insertError);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
      setNewMessage(messageContent); // Restore message on error
      return;
    }

    // Then trigger masterNarrate (server-side action)
    // The server will save the GM response to gm_messages
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
    }
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
            {loading && messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm">
                Carregando mensagens...
              </div>
            )}
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
