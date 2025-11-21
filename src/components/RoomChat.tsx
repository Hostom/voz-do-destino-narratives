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
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { VoicePanel } from "./VoicePanel";
import { VoiceFlame } from "./VoiceFlame";

interface GroupMessage {
  id: string;
  user_id: string;
  character_name: string;
  message: string;
  created_at: string;
  is_narrative?: boolean | null;
  room_id: string;
  sender?: "player" | "GM" | string;
  type?: "gm" | string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

  // Get current user ID for voice chat
  const [currentUserId, setCurrentUserId] = useState<string>("");
  
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getUserId();
  }, []);

  // Initialize voice chat
  const {
    isConnected,
    isMuted,
    speakingMap,
    connectedPeers,
    connect,
    disconnect,
    toggleMute,
  } = useVoiceChat({
    roomId,
    userId: currentUserId,
    userName: characterName,
  });

  // CRITICAL: Use useCollection with filters to subscribe ONLY to room_chat_messages
  // This is the single source of truth for group strategy messages
  const { data: allMessages, loading: messagesLoading } = useCollection<GroupMessage>("room_chat_messages", {
    filters: { room_id: roomId },
    orderBy: "created_at",
    ascending: true,
  });

  // CRITICAL: Filter at render level to ensure NO GM messages appear
  // Block messages based on multiple criteria to catch all GM messages
  const messages = allMessages.filter((msg) => {
    // Block if sender is GM
    if (msg.sender === "GM") return false;
    // Block if type is gm
    if (msg.type === "gm") return false;
    // Block if is_narrative is true (fallback)
    if (msg.is_narrative === true) return false;
    return true;
  });

  const isMyTurn = initiativeOrder[currentTurn]?.character_name === characterName;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Configurar presence para typing indicators (separate from message subscription)
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

  // CRITICAL: This function handles ONLY group social chat
  // It saves to room_chat_messages ONLY (NOT gm_messages)
  // It does NOT trigger game-master or any AI interaction
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

    // CRITICAL: Save ONLY to room_chat_messages (NOT gm_messages)
    // This is for player-to-player strategy discussions
    // NEVER trigger game-master from here
    const { error } = await supabase.from("room_chat_messages").insert({
      room_id: roomId,
      user_id: user.id,
      character_name: characterName,
      message: newMessage.trim(),
      is_narrative: false, // Group chat is NEVER narrative
    });

    if (error) {
      console.error("Error sending group chat message:", error);
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
    <div className="h-full flex flex-col gap-3">
      {/* Voice Panel */}
      <VoicePanel
        isConnected={isConnected}
        isMuted={isMuted}
        connectedPeers={connectedPeers}
        speakingMap={speakingMap}
        onConnect={connect}
        onDisconnect={disconnect}
        onToggleMute={toggleMute}
      />

      {/* Chat Card */}
      <Card className="flex-1 flex flex-col bg-card/80 backdrop-blur border-primary/20 min-h-0">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            Chat do Grupo (Social)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Discussões e estratégias entre jogadores - Não interage com a IA
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
              {messagesLoading && messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Carregando mensagens...
                </div>
              )}
              {!messagesLoading && messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>Nenhuma mensagem social ainda.</p>
                  <p className="text-xs mt-1">Use este chat para discutir estratégias com o grupo.</p>
                </div>
              )}
              {messages.map((msg) => {
                // CRITICAL: Double-check at render level - block ANY narrative message
                if (msg.is_narrative === true) {
                  console.warn("Blocked narrative message at render level:", msg);
                  return null;
                }
                
                // Additional safety checks
                if (msg.sender === "GM" || msg.type === "gm") {
                  console.warn("Blocked GM message at render level:", msg);
                  return null;
                }
                
                return (
                  <div
                    key={msg.id}
                    className="rounded-lg p-3 animate-in slide-in-from-bottom-2 bg-secondary/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {/* Voice Flame Indicator */}
                      <VoiceFlame 
                        userId={msg.user_id} 
                        isSpeaking={speakingMap[msg.user_id] || false} 
                      />
                      <div className="flex items-baseline gap-2 flex-1">
                        <span className="font-semibold text-sm text-foreground">
                          {msg.character_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground ml-8">
                      {msg.message}
                    </p>
                  </div>
                );
              })}
              
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
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Discuta estratégias com o grupo..."
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
    </div>
  );
};
