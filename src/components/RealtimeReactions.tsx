import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Smile, Zap, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Reaction {
  id: string;
  player_id: string;
  character_name: string;
  reaction_type: string;
  reaction_content: string;
  created_at: string;
  expires_at: string;
}

interface TypingUser {
  character_name: string;
  user_id: string;
}

interface RealtimeReactionsProps {
  roomId: string;
  characterName: string;
  userId: string;
}

const EMOJI_PRESETS = ['👍', '👎', '😂', '😮', '🔥', '💪', '🎲', '⚔️', '🛡️', '✨', '💀', '❤️'];

const QUICK_REACTIONS = [
  'Vou junto!',
  'Cuidado!',
  'Espera!',
  'Concordo',
  'Boa ideia!',
  'Não faça isso!',
];

export const RealtimeReactions = ({ roomId, characterName, userId }: RealtimeReactionsProps) => {
  const { toast } = useToast();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [customReaction, setCustomReaction] = useState("");
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    // Subscribe to reactions
    const reactionsChannel = supabase
      .channel(`reactions-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_reactions',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const newReaction = payload.new as Reaction;
          setReactions(prev => [...prev, newReaction]);
          
          // Auto-remove after expiration
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== newReaction.id));
          }, 30000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'player_reactions'
        },
        (payload) => {
          setReactions(prev => prev.filter(r => r.id !== payload.old.id));
        }
      )
      .subscribe();

    // Setup presence for typing indicators
    const presenceChannel = supabase.channel(`room-presence-${roomId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typing = Object.values(state)
          .flat()
          .filter((user: any) => user.is_typing && user.user_id !== userId)
          .map((user: any) => ({
            character_name: user.character_name,
            user_id: user.user_id
          }));
        setTypingUsers(typing);
      })
      .subscribe();

    setChannel(presenceChannel);

    // Load existing reactions
    const loadReactions = async () => {
      const { data, error } = await supabase
        .from('player_reactions')
        .select('*')
        .eq('room_id', roomId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReactions(data);
        
        // Setup auto-cleanup for loaded reactions
        data.forEach(reaction => {
          const timeUntilExpiry = new Date(reaction.expires_at).getTime() - Date.now();
          if (timeUntilExpiry > 0) {
            setTimeout(() => {
              setReactions(prev => prev.filter(r => r.id !== reaction.id));
            }, timeUntilExpiry);
          }
        });
      }
    };

    loadReactions();

    return () => {
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [roomId, userId]);

  const sendReaction = async (type: string, content: string) => {
    const { error } = await supabase
      .from('player_reactions')
      .insert({
        room_id: roomId,
        player_id: userId,
        character_name: characterName,
        reaction_type: type,
        reaction_content: content
      });

    if (error) {
      console.error('Error sending reaction:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a reação",
        variant: "destructive",
      });
    }
  };

  const handleEmojiReaction = (emoji: string) => {
    sendReaction('emoji', emoji);
  };

  const handleQuickReaction = (text: string) => {
    sendReaction('quick_text', text);
  };

  const handleCustomReaction = () => {
    if (customReaction.trim()) {
      sendReaction('action', customReaction.trim());
      setCustomReaction("");
    }
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (channel) {
      await channel.track({
        user_id: userId,
        character_name: characterName,
        is_typing: isTyping,
        online_at: new Date().toISOString()
      });
    }
  };

  return (
    <div className="relative">
      {/* Floating reactions */}
      <div className="fixed top-20 right-4 left-4 md:left-auto md:w-96 pointer-events-none z-50 space-y-2">
        <AnimatePresence>
          {reactions.slice(0, 5).map((reaction) => (
            <motion.div
              key={reaction.id}
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="bg-card/95 backdrop-blur border border-primary/20 rounded-lg p-3 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-primary">
                  {reaction.character_name}
                </span>
                <span className="text-muted-foreground text-xs">•</span>
                <span className={`${reaction.reaction_type === 'emoji' ? 'text-2xl' : 'text-sm'}`}>
                  {reaction.reaction_content}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Typing indicators */}
      {typingUsers.length > 0 && (
        <div className="mb-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-muted-foreground italic"
          >
            {typingUsers.map(u => u.character_name).join(', ')} {typingUsers.length === 1 ? 'está' : 'estão'} digitando...
          </motion.div>
        </div>
      )}

      {/* Reaction controls */}
      <div className="flex gap-2">
        {/* Emoji reactions */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Smile className="w-4 h-4" />
              Emoji
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_PRESETS.map(emoji => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="text-2xl p-2 h-auto"
                  onClick={() => handleEmojiReaction(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick reactions */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Zap className="w-4 h-4" />
              Rápido
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <div className="space-y-2">
              {QUICK_REACTIONS.map(text => (
                <Button
                  key={text}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => handleQuickReaction(text)}
                >
                  {text}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Custom reaction */}
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Reação customizada..."
            value={customReaction}
            onChange={(e) => setCustomReaction(e.target.value)}
            onFocus={() => updateTypingStatus(true)}
            onBlur={() => updateTypingStatus(false)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCustomReaction();
              }
            }}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={handleCustomReaction}
            disabled={!customReaction.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
