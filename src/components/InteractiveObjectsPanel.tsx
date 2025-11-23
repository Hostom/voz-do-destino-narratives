import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Dices, Lock, Unlock, Sparkles } from "lucide-react";

interface InteractiveObject {
  id: string;
  object_type: string;
  name: string;
  description: string | null;
  dc: number;
  item_name: string;
  item_type: string;
  item_description: string | null;
  quantity: number;
  weight: number;
  properties: any;
  looted: boolean;
}

interface InteractiveObjectsPanelProps {
  characterId: string;
  roomId: string;
}

export const InteractiveObjectsPanel = ({
  characterId,
  roomId,
}: InteractiveObjectsPanelProps) => {
  const [objects, setObjects] = useState<InteractiveObject[]>([]);
  const [rolling, setRolling] = useState<string | null>(null);

  const objectTypeLabels: Record<string, string> = {
    chest: "Baú",
    crate: "Caixote",
    barrel: "Barril",
    corpse: "Corpo",
    altar: "Altar",
    custom: "Objeto",
  };

  useEffect(() => {
    loadObjects();

    const channel = supabase
      .channel("interactive-objects-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interactive_objects",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadObjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId, roomId]);

  const loadObjects = async () => {
    try {
      const { data, error } = await supabase
        .from("interactive_objects")
        .select("*")
        .eq("room_id", roomId)
        .eq("looted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setObjects(data || []);
    } catch (error) {
      console.error("Erro ao carregar objetos:", error);
    }
  };

  const handleInteract = async (obj: InteractiveObject) => {
    setRolling(obj.id);

    try {
      // Roll 1d20 (pure luck, no modifiers)
      const rollResult = Math.floor(Math.random() * 20) + 1;
      const success = rollResult >= obj.dc;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Record the loot check
      const { error: checkError } = await supabase.from("loot_checks").insert({
        room_id: roomId,
        npc_id: obj.id,
        npc_name: obj.name,
        character_id: characterId,
        check_result: rollResult,
        dc: obj.dc,
        success,
        item_name: obj.item_name,
        item_type: obj.item_type,
        item_description: obj.item_description,
        quantity: obj.quantity,
        weight: obj.weight,
        properties: obj.properties,
      });

      if (checkError) throw checkError;

      // If successful, add item to inventory and mark as looted
      if (success) {
        const { error: itemError } = await supabase.from("character_items").insert({
          character_id: characterId,
          item_name: obj.item_name,
          item_type: obj.item_type,
          description: obj.item_description,
          quantity: obj.quantity,
          weight: obj.weight,
          properties: obj.properties,
        });

        if (itemError) throw itemError;

        // Mark as looted
        await supabase
          .from("interactive_objects")
          .update({ looted: true, looted_by_character_id: characterId, looted_at: new Date().toISOString() })
          .eq("id", obj.id);

        toast.success(
          <div>
            <div className="font-bold">Sucesso! 🎉</div>
            <div>Rolagem: {rollResult} (DC {obj.dc})</div>
            <div>Você encontrou: {obj.item_name}</div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(
          <div>
            <div className="font-bold">Falhou!</div>
            <div>Rolagem: {rollResult} (DC {obj.dc})</div>
            <div>Você não conseguiu abrir o {objectTypeLabels[obj.object_type].toLowerCase()}...</div>
          </div>,
          { duration: 5000 }
        );
      }

      // Send message to GM
      const { data: character } = await supabase
        .from("characters")
        .select("name")
        .eq("id", characterId)
        .single();

      await supabase.from("gm_messages").insert({
        room_id: roomId,
        player_id: user.id,
        character_name: character?.name || "Jogador",
        sender: character?.name || "Jogador",
        type: "ability_check",
        content: `tentou interagir com ${obj.name} - Teste: ${rollResult} vs DC ${obj.dc} - ${success ? `✅ SUCESSO! Encontrou ${obj.item_name}` : "❌ FALHOU"}`,
      });

      loadObjects();
    } catch (error: any) {
      console.error("Erro ao interagir com objeto:", error);
      toast.error("Erro ao interagir com objeto");
    } finally {
      setRolling(null);
    }
  };

  if (objects.length === 0) return null;

  return (
    <Card className="border-purple-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          Objetos Disponíveis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {objects.map((obj) => (
          <Card key={obj.id} className="p-3 bg-purple-500/5 border-purple-500/20">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm">{obj.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {objectTypeLabels[obj.object_type]}
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Lock className="h-3 w-3" />
                      DC {obj.dc}
                    </Badge>
                  </div>
                  {obj.description && (
                    <p className="text-xs text-muted-foreground mt-1">{obj.description}</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Faça um <strong>teste de sorte</strong> (1d20 puro) para tentar abrir/interagir.
              </p>

              <Button
                onClick={() => handleInteract(obj)}
                disabled={rolling === obj.id}
                className="w-full"
                size="sm"
              >
                <Dices className="h-4 w-4 mr-2" />
                {rolling === obj.id ? "Rolando..." : "Tentar Abrir/Interagir"}
              </Button>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};
