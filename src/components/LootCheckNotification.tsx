import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Scroll, Dices, Sparkles } from "lucide-react";

interface LootRequest {
  id: string;
  npc_name: string;
  dc: number;
  item_name: string;
  item_type: string;
  item_description: string;
  quantity: number;
  weight: number;
  properties: any;
  room_id: string;
  npc_id: string;
  target_character_id: string;
}

interface LootCheckNotificationProps {
  characterId: string;
  roomId: string;
}

export const LootCheckNotification = ({
  characterId,
  roomId,
}: LootCheckNotificationProps) => {
  const [lootRequests, setLootRequests] = useState<LootRequest[]>([]);
  const [rolling, setRolling] = useState<string | null>(null);

  useEffect(() => {
    loadLootRequests();

    const channel = supabase
      .channel("loot-requests-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "loot_requests",
          filter: `target_character_id=eq.${characterId}`,
        },
        () => {
          loadLootRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const loadLootRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("loot_requests")
        .select("*")
        .eq("target_character_id", characterId)
        .eq("completed", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLootRequests(data || []);
    } catch (error) {
      console.error("Erro ao carregar solicitações de loot:", error);
    }
  };

  const rollLuckCheck = async (request: LootRequest) => {
    setRolling(request.id);

    try {
      // Roll 1d20 (pure luck, no modifiers)
      const rollResult = Math.floor(Math.random() * 20) + 1;
      const success = rollResult >= request.dc;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Record the loot check
      const { error: checkError } = await supabase.from("loot_checks").insert({
        room_id: request.room_id,
        npc_id: request.npc_id,
        npc_name: request.npc_name,
        character_id: characterId,
        check_result: rollResult,
        dc: request.dc,
        success,
        item_name: request.item_name,
        item_type: request.item_type,
        item_description: request.item_description,
        quantity: request.quantity,
        weight: request.weight,
        properties: request.properties,
      });

      if (checkError) throw checkError;

      // If successful, add item to inventory
      if (success) {
        const { error: itemError } = await supabase.from("character_items").insert({
          character_id: characterId,
          item_name: request.item_name,
          item_type: request.item_type,
          description: request.item_description,
          quantity: request.quantity,
          weight: request.weight,
          properties: request.properties,
        });

        if (itemError) throw itemError;

        toast.success(
          <div>
            <div className="font-bold">Loot Encontrado! 🎉</div>
            <div>Rolagem: {rollResult} (DC {request.dc})</div>
            <div>Você encontrou: {request.item_name}</div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(
          <div>
            <div className="font-bold">Nada Encontrado</div>
            <div>Rolagem: {rollResult} (DC {request.dc})</div>
            <div>Você não encontrou nada de útil...</div>
          </div>,
          { duration: 5000 }
        );
      }

      // Mark request as completed
      await supabase
        .from("loot_requests")
        .update({ completed: true })
        .eq("id", request.id);

      // Send message to GM
      const { data: character } = await supabase
        .from("characters")
        .select("name")
        .eq("id", characterId)
        .single();

      await supabase.from("gm_messages").insert({
        room_id: request.room_id,
        player_id: user.id,
        character_name: character?.name || "Jogador",
        sender: character?.name || "Jogador",
        type: "ability_check",
        content: `vasculhou ${request.npc_name} - Teste de Sorte: ${rollResult} vs DC ${request.dc} - ${success ? `✅ SUCESSO! Encontrou ${request.item_name}` : "❌ FALHOU"}`,
      });

      loadLootRequests();
    } catch (error: any) {
      console.error("Erro ao fazer teste de loot:", error);
      toast.error("Erro ao fazer teste de loot");
    } finally {
      setRolling(null);
    }
  };

  if (lootRequests.length === 0) return null;

  return (
    <div className="space-y-2">
      {lootRequests.map((request) => (
        <Card key={request.id} className="border-2 border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scroll className="h-5 w-5" />
              Vasculhar Corpo: {request.npc_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <Dices className="h-3 w-3" />
                DC {request.dc}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {request.item_name}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              O Mestre solicita que você faça um <strong>teste de sorte</strong> (1d20 puro, sem
              modificadores) para vasculhar o corpo deste inimigo derrotado.
            </p>

            {request.item_description && (
              <p className="text-sm italic text-muted-foreground">
                Possível loot: {request.item_description}
              </p>
            )}

            <Button
              onClick={() => rollLuckCheck(request)}
              disabled={rolling === request.id}
              className="w-full"
            >
              {rolling === request.id ? "Rolando..." : "Rolar Teste de Sorte (1d20)"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
