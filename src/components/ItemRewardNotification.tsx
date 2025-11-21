import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ItemRewardNotificationProps {
  characterId: string;
}

export function ItemRewardNotification({ characterId }: ItemRewardNotificationProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (!characterId) return;

    const channel = supabase
      .channel(`item-rewards-${characterId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "item_rewards",
          filter: `character_id=eq.${characterId}`,
        },
        (payload) => {
          const reward = payload.new as any;
          
          toast({
            title: "🎁 Novo Item Recebido!",
            description: `Você recebeu: ${reward.item_name} (x${reward.quantity})${
              reward.reason ? ` - ${reward.reason}` : ""
            }`,
            duration: 6000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, toast]);

  return null;
}
