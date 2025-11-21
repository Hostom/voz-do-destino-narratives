import { Heart, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getXPProgressPercentage } from "@/lib/dnd-xp-progression";

interface CharacterStatsBarProps {
  characterId: string;
}

interface CharacterStats {
  current_hp: number;
  max_hp: number;
  experience_points: number;
  level: number;
}

export const CharacterStatsBar = ({ characterId }: CharacterStatsBarProps) => {
  const [stats, setStats] = useState<CharacterStats | null>(null);

  useEffect(() => {
    if (!characterId) return;

    // Load initial stats
    const loadStats = async () => {
      const { data } = await supabase
        .from('characters')
        .select('current_hp, max_hp, experience_points, level')
        .eq('id', characterId)
        .single();
      
      if (data) {
        setStats(data);
      }
    };

    loadStats();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`character-stats-bar-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`
        },
        (payload) => {
          const newData = payload.new as CharacterStats;
          setStats(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  if (!stats) return null;

  const hpPercentage = (stats.current_hp / stats.max_hp) * 100;
  const xpPercentage = getXPProgressPercentage(stats.experience_points, stats.level);

  return (
    <div className="flex flex-col gap-2 p-3 bg-card/50 border border-border/50 rounded-lg backdrop-blur">
      {/* HP Bar */}
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-destructive flex-shrink-0" />
        <div className="flex-1">
          <Progress 
            value={hpPercentage} 
            className="h-2.5 bg-muted"
            indicatorClassName={hpPercentage > 50 ? "bg-green-500" : hpPercentage > 25 ? "bg-yellow-500" : "bg-destructive"}
          />
        </div>
        <span className="text-xs font-medium min-w-[50px] text-right">
          {stats.current_hp}/{stats.max_hp}
        </span>
      </div>
      
      {/* XP Bar */}
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex-1">
          <Progress 
            value={xpPercentage} 
            className="h-2.5 bg-muted"
            indicatorClassName="bg-primary"
          />
        </div>
        <span className="text-xs font-medium min-w-[50px] text-right">
          Nv {stats.level}
        </span>
      </div>
    </div>
  );
};
