import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scroll } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CombatLogEntry {
  id: string;
  character_name: string;
  action_type: string;
  target_name?: string;
  roll_result?: number;
  damage?: number;
  description: string;
  created_at: string;
}

interface CombatLogProps {
  roomId: string;
}

export const CombatLog = ({ roomId }: CombatLogProps) => {
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLogs = async () => {
      const { data, error } = await supabase
        .from("combat_log")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setLogs(data);
      }
    };

    loadLogs();

    // Subscribe to new logs
    const channel = supabase
      .channel(`combat-log-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "combat_log",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setLogs((prev) => [...prev, payload.new as CombatLogEntry]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case "attack":
        return "text-destructive";
      case "cast_spell":
        return "text-primary";
      case "dodge":
      case "disengage":
        return "text-blue-500";
      case "help":
        return "text-green-500";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scroll className="w-5 h-5" />
          Log de Combate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full rounded-md border p-4" ref={scrollRef}>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma ação registrada ainda...
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-background/50 border border-border"
                >
                  <p className={`text-sm font-semibold ${getActionColor(log.action_type)}`}>
                    {log.character_name}
                    {log.target_name && ` → ${log.target_name}`}
                  </p>
                  <p className="text-sm mt-1">{log.description}</p>
                  {log.damage !== undefined && log.damage > 0 && (
                    <p className="text-xs text-destructive font-bold mt-1">
                      💥 {log.damage} de dano
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
