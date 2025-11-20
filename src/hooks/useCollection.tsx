import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UseCollectionOptions {
  roomId: string;
  orderBy?: string;
  ascending?: boolean;
}

export function useCollection<T extends Record<string, any>>(
  tableName: string,
  options: UseCollectionOptions
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const query = supabase
          .from(tableName as any)
          .select("*")
          .eq("room_id", options.roomId)
          .order(options.orderBy || "created_at", { ascending: options.ascending !== false });

        const { data: fetchedData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (mounted) {
          setData((fetchedData as T[]) || []);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setLoading(false);
        }
      }
    };

    loadData();

    // Setup real-time subscription
    const channel = supabase.channel(`${tableName}-${options.roomId}-${Date.now()}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName as any,
          filter: `room_id=eq.${options.roomId}`,
        },
        async (payload) => {
          if (!mounted) return;

          console.log(`Real-time update for ${tableName}:`, payload.eventType, payload.new || payload.old);

          // Reload all data to ensure consistency
          // This ensures we always have the correct sorted order and no duplicates
          try {
            const { data: updatedData, error: reloadError } = await supabase
              .from(tableName as any)
              .select("*")
              .eq("room_id", options.roomId)
              .order(options.orderBy || "created_at", { ascending: options.ascending !== false });

            if (!reloadError && updatedData) {
              console.log(`Reloaded ${tableName}: ${updatedData.length} items`);
              setData((updatedData as T[]) || []);
            } else if (reloadError) {
              console.error(`Error reloading ${tableName} after real-time update:`, reloadError);
            }
          } catch (err) {
            console.error(`Exception reloading ${tableName}:`, err);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`✅ Subscribed to ${tableName} for room ${options.roomId}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`❌ Error subscribing to ${tableName} for room ${options.roomId}`);
        }
      });

    channelRef.current = channel;

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [tableName, options.roomId, options.orderBy, options.ascending]);

  return { data, loading, error };
}

