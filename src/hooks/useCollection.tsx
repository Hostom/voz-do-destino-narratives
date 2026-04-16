import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UseCollectionOptions {
  roomId?: string;
  filters?: Record<string, any>;
  orderBy?: string;
  ascending?: boolean;
  limit?: number; // Added limit for performance
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
    if (!options.roomId && !options.filters) {
      setData([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadData = async (shouldShowLoading = true) => {
      try {
        if (shouldShowLoading) setLoading(true);
        setError(null);

        let query = supabase.from(tableName as any).select("*");

        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        } else if (options.roomId) {
          query = query.eq("room_id", options.roomId);
        }

        query = query.order(options.orderBy || "created_at", {
          ascending: options.ascending !== false 
        });

        if (options.limit) {
          query = query.limit(options.limit);
        }

        const { data: fetchedData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (mounted) {
          setData((fetchedData as unknown as T[]) || []);
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

    let realtimeFilter = "";
    if (options.filters) {
      const filterParts = Object.entries(options.filters).map(
        ([key, value]) => `${key}=eq.${value}`
      );
      realtimeFilter = filterParts.join(",");
    } else if (options.roomId) {
      realtimeFilter = `room_id=eq.${options.roomId}`;
    }

    const channelName = `${tableName}-${realtimeFilter || "default"}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName as any,
          filter: realtimeFilter || undefined,
        },
        async () => {
          if (!mounted) return;
          // Reload without full loading state to prevent flickering
          await loadData(false);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [tableName, options.roomId, JSON.stringify(options.filters), options.orderBy, options.ascending, options.limit]);

  return { data, loading, error };
}
