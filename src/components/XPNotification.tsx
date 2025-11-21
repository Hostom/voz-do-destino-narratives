import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, TrendingUp } from "lucide-react";

interface XPNotificationProps {
  characterId: string;
}

export const XPNotification = ({ characterId }: XPNotificationProps) => {
  const { toast } = useToast();
  const [lastXP, setLastXP] = useState<number | null>(null);

  useEffect(() => {
    if (!characterId) return;

    // Load initial XP
    const loadInitialXP = async () => {
      const { data } = await supabase
        .from("characters")
        .select("experience_points")
        .eq("id", characterId)
        .single();

      if (data) {
        setLastXP(data.experience_points);
      }
    };

    loadInitialXP();

    // Subscribe to XP changes
    const channel = supabase
      .channel(`xp-notifications-${characterId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "characters",
          filter: `id=eq.${characterId}`,
        },
        (payload: any) => {
          const newXP = payload.new.experience_points;
          const oldXP = payload.old?.experience_points || lastXP;

          if (oldXP !== null && newXP > oldXP) {
            const xpGained = newXP - oldXP;
            const newLevel = payload.new.level;
            const oldLevel = payload.old?.level || newLevel;
            const leveledUp = newLevel > oldLevel;

            if (leveledUp) {
              toast({
                title: "🎉 Level Up!",
                description: (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-yellow-500" />
                    <div>
                      <div className="font-semibold">Você subiu para o nível {newLevel}!</div>
                      <div className="text-xs text-muted-foreground">+{xpGained} XP ganho</div>
                    </div>
                  </div>
                ),
                duration: 6000,
              });
            } else {
              toast({
                title: "XP Ganho!",
                description: (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold">+{xpGained} XP</div>
                      <div className="text-xs text-muted-foreground">
                        Total: {newXP.toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                ),
                duration: 4000,
              });
            }
          }

          setLastXP(newXP);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, lastXP, toast]);

  return null;
};
