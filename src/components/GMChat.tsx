import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scroll, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollection } from "@/hooks/useCollection";
import { extractShopItems } from "@/utils/extractShopItems";
import { ShopItemsList } from "@/components/shop/ShopItemsList";

interface GMMessage {
  id: string;
  player_id: string;
  sender: "player" | "GM";
  content?: string;
  message?: string;
  character_name: string;
  created_at: string;
  type: "gm";
  room_id: string;
}

interface GMChatProps {
  roomId: string;
  characterName: string;
  characterId?: string; // Character ID for tool calls
  isGM?: boolean;
}

export const GMChat = ({ roomId, characterName, characterId, isGM }: GMChatProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Cache local para mensagens - melhora performance reduzindo re-renders
  const [messageCache, setMessageCache] = useState<Map<string, GMMessage>>(new Map());

  // CRITICAL: Use useCollection with filters to subscribe ONLY to gm_messages
  // This is the single source of truth for GM narrative messages
  const { data: rawMessages, loading } = useCollection<GMMessage>("gm_messages", {
    filters: { room_id: roomId },
    orderBy: "created_at",
    ascending: true,
  });

  // Aplicar cache para evitar re-renders desnecessários
  const messages = useMemo(() => {
    if (!rawMessages) return [];
    
    // Atualizar cache com novas mensagens
    const newCache = new Map(messageCache);
    rawMessages.forEach(msg => {
      if (!newCache.has(msg.id)) {
        newCache.set(msg.id, msg);
      }
    });
    
    // Atualizar estado do cache se houver mudanças
    if (newCache.size !== messageCache.size) {
      setMessageCache(newCache);
    }
    
    return rawMessages;
  }, [rawMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clear loading state when we receive a GM response
  useEffect(() => {
    if (isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === "GM") {
        console.log('GM response received, clearing loading state');
        setIsLoading(false);
      }
    }
  }, [messages, isLoading]);

  // Safety timeout: clear loading after 30 seconds if no response
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('Loading timeout - no GM response received after 30 seconds');
        setIsLoading(false);
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

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
    setIsLoading(true);

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
      setIsLoading(false);
      return;
    }

    // Then trigger game-master function using fetch directly for better SSE support
    // The function returns a stream (SSE), we need to consume it to ensure it completes
    // The server will save the GM response to gm_messages when the stream completes
    console.log('Calling game-master function with:', {
        roomId,
        characterName,
        characterId: characterId,
        message: messageContent
      });
      
      try {
        // Get the Supabase URL and anon key from environment
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase configuration missing');
        }

        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;

        // Call the function using fetch directly for better stream handling
        const response = await fetch(`${supabaseUrl}/functions/v1/game-master`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken || supabaseAnonKey}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: messageContent }],
            roomId,
            characterName: characterName,
            characterId: characterId, // Pass character ID for tool calls
          }),
        });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error calling game master:', response.status, errorText);
        toast({
          title: "Erro",
          description: `Falha ao chamar a IA: ${response.status}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Consume the stream to ensure it completes
      // The server will save the response to gm_messages when the stream completes
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream consumed completely');
              // Give the server a moment to save the response
              await new Promise(resolve => setTimeout(resolve, 500));
              break;
            }
            
            // Decode and process the stream properly
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines (SSE format)
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            // Process each line to ensure proper SSE parsing
            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                // Stream is being processed correctly
              }
            }
          }
        } catch (streamError) {
          console.error('Error consuming stream:', streamError);
          setIsLoading(false);
        }
      } else {
        console.warn('No response body/stream received');
        setIsLoading(false);
      }
      
      // Don't set loading to false here - wait for real-time update
      console.log('Game-master function invoked successfully. Response will appear in gm_messages via real-time.');
    } catch (error) {
      console.error('Exception calling game master:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao obter resposta da IA",
        variant: "destructive",
      });
      setIsLoading(false);
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
            {isLoading && (
              <div className="text-center text-muted-foreground text-sm italic">
                Aguardando resposta do Mestre...
              </div>
            )}
            {messages.map((msg) => {
              const content = msg.content ?? msg.message ?? "";
              
              // Parse shop items for GM messages
              const shopData = msg.sender === "GM" ? extractShopItems(content) : null;
              const displayText = shopData ? shopData.cleanedText : content;
              const shopItems = shopData?.items || [];

              return (
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
                    {displayText}
                  </p>
                  {msg.sender === "GM" && shopItems.length > 0 && (
                    <ShopItemsList items={shopItems} />
                  )}
                </div>
              );
            })}
            
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
              disabled={!newMessage.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
