import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

interface TurnHistoryEntry {
  id: string;
  character_name: string;
  message: string;
  created_at: string;
  is_narrative?: boolean;
}

interface TurnHistoryProps {
  roomId: string;
}

export const TurnHistory = ({ roomId }: TurnHistoryProps) => {
  const [history, setHistory] = useState<TurnHistoryEntry[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("room_chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error loading turn history:", error);
        return;
      }

      if (data) {
        setHistory(data.reverse());
      }
    };

    loadHistory();

    // Subscribe to new messages
    const channel = supabase
      .channel(`turn-history:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setHistory((prev) => {
            const newHistory = [...prev, payload.new as TurnHistoryEntry];
            return newHistory.slice(-10); // Keep only last 10
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4" />
          Histórico de Turnos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma ação registrada ainda
              </p>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className={`text-xs p-2 rounded ${
                    entry.is_narrative
                      ? "bg-primary/10 border-l-2 border-primary"
                      : "bg-secondary/30"
                  }`}
                >
                  <div className="flex items-baseline gap-1 mb-1">
                    {entry.is_narrative && <span className="font-bold">📜</span>}
                    <span className="font-semibold text-primary">
                      {entry.character_name}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(entry.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-foreground line-clamp-2">{entry.message}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
