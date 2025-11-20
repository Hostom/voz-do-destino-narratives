import { Scroll, Sparkles, LogOut, Users, ArrowLeft, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getXPForLevel, getXPProgressPercentage } from "@/lib/dnd-xp-progression";

interface GameHeaderProps {
  onLogout?: () => void;
  onBackToCharacterSelect?: () => void;
  onBackToLobby?: () => void;
  roomCode?: string;
  characterId?: string;
}

interface CharacterStats {
  current_hp: number;
  max_hp: number;
  experience_points: number;
  level: number;
}

export const GameHeader = ({ onLogout, onBackToCharacterSelect, onBackToLobby, roomCode, characterId }: GameHeaderProps) => {
  const [stats, setStats] = useState<CharacterStats | null>(null);

  useEffect(() => {
    if (!characterId) return;

    console.log('[GameHeader] Setting up for character:', characterId);

    // Load initial stats
    const loadStats = async () => {
      const { data } = await supabase
        .from('characters')
        .select('current_hp, max_hp, experience_points, level')
        .eq('id', characterId)
        .single();
      
      if (data) {
        console.log('[GameHeader] Initial stats loaded:', data);
        setStats(data);
      }
    };

    loadStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`character-stats-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`
        },
        (payload) => {
          console.log('[GameHeader] Realtime update received:', payload);
          const newData = payload.new as CharacterStats;
          console.log('[GameHeader] Updating stats to:', newData);
          setStats(newData);
        }
      )
      .subscribe((status) => {
        console.log('[GameHeader] Subscription status:', status);
      });

    return () => {
      console.log('[GameHeader] Cleaning up subscription for:', characterId);
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const hpPercentage = stats ? (stats.current_hp / stats.max_hp) * 100 : 0;
  const xpPercentage = stats ? getXPProgressPercentage(stats.experience_points, stats.level) : 0;
  const xpToNextLevel = stats ? getXPForLevel(stats.level) - stats.experience_points : 0;

  return (
    <header className="relative border-b border-border/50 backdrop-blur-epic bg-card/30">
      <div className="container mx-auto px-3 md:px-6 py-3 md:py-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <div className="relative flex-shrink-0">
              <Scroll className="h-6 w-6 md:h-8 md:w-8 text-primary animate-pulse-slow" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 md:h-4 md:w-4 text-accent animate-glow" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-3xl font-cinzel font-bold text-gradient-epic truncate">
                Voz do Destino
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">AI Game Master</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
            {/* Character Stats */}
            {stats && (
              <div className="hidden lg:flex flex-col gap-1.5 mr-4 min-w-[200px]">
                {/* HP Bar */}
                <div className="flex items-center gap-2">
                  <Heart className="h-3.5 w-3.5 text-destructive" />
                  <div className="flex-1">
                    <Progress 
                      value={hpPercentage} 
                      className="h-2 bg-muted"
                      indicatorClassName={hpPercentage > 50 ? "bg-green-500" : hpPercentage > 25 ? "bg-yellow-500" : "bg-destructive"}
                    />
                  </div>
                  <span className="text-xs font-medium min-w-[45px] text-right">
                    {stats.current_hp}/{stats.max_hp}
                  </span>
                </div>
                
                {/* XP Bar */}
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  <div className="flex-1">
                    <Progress 
                      value={xpPercentage} 
                      className="h-2 bg-muted"
                      indicatorClassName="bg-primary"
                    />
                  </div>
                  <span className="text-xs font-medium min-w-[45px] text-right">
                    Nv {stats.level}
                  </span>
                </div>
              </div>
            )}
            
            <div className="hidden lg:flex items-center gap-2 mr-2 md:mr-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                {roomCode ? `Sala: ${roomCode}` : 'Sistema Ativo'}
              </span>
            </div>
            
            {onBackToLobby && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToLobby}
                className="gap-1 md:gap-2 h-7 md:h-9 px-2 md:px-3"
              >
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline text-xs md:text-sm">Lobby</span>
              </Button>
            )}
            
            {onBackToCharacterSelect && !roomCode && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToCharacterSelect}
                className="gap-1 md:gap-2 h-7 md:h-9 px-2 md:px-3"
              >
                <Users className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline text-xs md:text-sm">Personagens</span>
              </Button>
            )}
            
            {onLogout && (
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="gap-1 md:gap-2 h-7 md:h-9 px-2 md:px-3"
              >
                <LogOut className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline text-xs md:text-sm">Sair</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Epic glow effect */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none"></div>
    </header>
  );
};
