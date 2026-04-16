import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const { toast } = useToast();

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

  const {
    isConnected,
    isMuted,
    isPushToTalk,
    isPTTActive,
    speakingMap,
    connectedPeers,
    peerStats,
    connect,
    disconnect,
    toggleMute,
    togglePushToTalk,
    setPeerVolume,
  } = useVoiceChat({
    roomId,
    userId: currentUserId,
    userName: characterName,
  });

  const { data: allMessages, loading: messagesLoading } = useCollection<GroupMessage>("room_chat_messages", {
    filters: { room_id: roomId },
    orderBy: "created_at",
    ascending: true,
  });

  const messages = allMessages.filter((msg) => {
    if (msg.sender === "GM") return false;
    if (msg.type === "gm") return false;
    if (msg.is_narrative === true) return false;
    return true;
  });

  const isMyTurn = initiativeOrder[currentTurn]?.character_name === characterName;

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const channelName = `room-chat-presence:${roomId}`;
    const channel = supabase.channel(channelName);

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing: TypingUser[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            if (presence.typing && presence.user_id !== currentUserId) {
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
        if (status === "SUBSCRIBED" && currentUserId) {
          await channel.track({
            user_id: currentUserId,
            character_name: characterName,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, characterName, currentUserId]);

  const handleTyping = async () => {
    if (!isTyping) {
      setIsTyping(true);
      if (currentUserId && channelRef.current) {
        await channelRef.current.track({
          user_id: currentUserId,
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
      if (currentUserId && channelRef.current) {
        await channelRef.current.track({
          user_id: currentUserId,
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

    if (!currentUserId) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("room_chat_messages").insert({
      room_id: roomId,
      user_id: currentUserId,
      character_name: characterName,
      message: newMessage.trim(),
      is_narrative: false,
    });

    if (error) {
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    setNewMessage("");
    setIsTyping(false);
    
    if (channelRef.current) {
      await channelRef.current.track({
        user_id: currentUserId,
        character_name: characterName,
        typing: false,
        online_at: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="h-full flex flex-col gap-3">
      <VoicePanel
        isConnected={isConnected}
        isMuted={isMuted}
        isPushToTalk={isPushToTalk}
        isPTTActive={isPTTActive}
        connectedPeers={connectedPeers}
        speakingMap={speakingMap}
        peerStats={peerStats}
        onConnect={connect}
        onDisconnect={disconnect}
        onToggleMute={toggleMute}
        onTogglePushToTalk={togglePushToTalk}
        onVolumeChange={setPeerVolume}
      />

      <Card className="flex-1 flex flex-col bg-card/80 backdrop-blur border-primary/20 min-h-0">
        <CardHeader className="pb-2 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4" />
            Chat Social
          </CardTitle>
          {initiativeOrder.length > 0 && (
            <div className="text-xs">
              <span className="text-muted-foreground">Turno: </span>
              <span className="font-semibold text-primary">{initiativeOrder[currentTurn]?.character_name}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-2 p-3 overflow-hidden min-h-0">
          <div
            ref={scrollAreaRef}
            className="flex-1 overflow-y-auto space-y-2 pr-1 scroll-smooth"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="rounded-lg p-2 bg-secondary/30"
              >
                <div className="flex items-center gap-2 mb-1">
                  <VoiceFlame
                    userId={msg.user_id}
                    isSpeaking={speakingMap[msg.user_id] || false}
                  />
                  <span className="font-semibold text-xs">{msg.character_name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm break-words ml-6">{msg.message}</p>
              </div>
            ))}
            {typingUsers.length > 0 && (
              <div className="text-[10px] text-muted-foreground italic pl-2">
                {typingUsers.map((u) => u.character_name).join(", ")} digitando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 pt-2">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              placeholder="Falar com o grupo..."
              className="flex-1 h-9 text-sm"
            />
            <Button type="submit" size="icon" className="h-9 w-9" disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
