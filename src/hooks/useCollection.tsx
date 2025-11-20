import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UseCollectionOptions {
  roomId?: string;
  filters?: Record<string, any>;
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
    // Don't load if neither roomId nor filters are provided
    if (!options.roomId && !options.filters) {
      console.warn(`useCollection: roomId or filters required for ${tableName}`);
      setData([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query
        let query = supabase.from(tableName as any).select("*");

        // Apply filters if provided
        if (options.filters) {
          Object.entries(options.filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        } else if (options.roomId) {
          // Fallback to roomId if no filters
          query = query.eq("room_id", options.roomId);
        }

        // Apply ordering
        query = query.order(options.orderBy || "created_at", { 
          ascending: options.ascending !== false 
        });

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

    // Build real-time filter
    let realtimeFilter = "";
    if (options.filters) {
      const filterParts = Object.entries(options.filters).map(
        ([key, value]) => `${key}=eq.${value}`
      );
      realtimeFilter = filterParts.join(",");
    } else if (options.roomId) {
      realtimeFilter = `room_id=eq.${options.roomId}`;
    }

    // Setup real-time subscription
    const channelName = `${tableName}-${realtimeFilter || "default"}-${Date.now()}`;
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
        async (payload) => {
          if (!mounted) return;

          console.log(`Real-time update for ${tableName}:`, payload.eventType, payload.new || payload.old);

          // Reload all data to ensure consistency
          try {
            let reloadQuery = supabase.from(tableName as any).select("*");

            // Apply same filters
            if (options.filters) {
              Object.entries(options.filters).forEach(([key, value]) => {
                reloadQuery = reloadQuery.eq(key, value);
              });
            } else if (options.roomId) {
              reloadQuery = reloadQuery.eq("room_id", options.roomId);
            }

            reloadQuery = reloadQuery.order(options.orderBy || "created_at", { 
              ascending: options.ascending !== false 
            });

            const { data: updatedData, error: reloadError } = await reloadQuery;

            if (!reloadError && updatedData) {
              console.log(`Reloaded ${tableName}: ${updatedData.length} items`);
              setData((updatedData as unknown as T[]) || []);
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
          console.log(`✅ Subscribed to ${tableName} with filter: ${realtimeFilter || "none"}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`❌ Error subscribing to ${tableName}`);
        }
      });

    channelRef.current = channel;

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [tableName, options.roomId, JSON.stringify(options.filters), options.orderBy, options.ascending]);

  return { data, loading, error };
}
