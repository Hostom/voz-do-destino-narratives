import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, AlertCircle } from "lucide-react";
import { RoomPlayer } from "@/hooks/useRoom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConditionsPanelProps {
  roomId: string;
  players: RoomPlayer[];
  isGM: boolean;
}

const D5E_CONDITIONS = [
  { id: "blinded", name: "Cego", effect: "Falha em testes baseados em visão, atacantes têm vantagem" },
  { id: "charmed", name: "Enfeitiçado", effect: "Não pode atacar o enfeitiçador" },
  { id: "deafened", name: "Surdo", effect: "Falha em testes baseados em audição" },
  { id: "frightened", name: "Amedrontado", effect: "Desvantagem em testes enquanto vê a fonte do medo" },
  { id: "grappled", name: "Agarrado", effect: "Velocidade = 0" },
  { id: "incapacitated", name: "Incapacitado", effect: "Não pode realizar ações ou reações" },
  { id: "invisible", name: "Invisível", effect: "Vantagem em ataques, ataques contra têm desvantagem" },
  { id: "paralyzed", name: "Paralisado", effect: "Incapacitado, testes de FOR/DES falham automaticamente" },
  { id: "petrified", name: "Petrificado", effect: "Transformado em pedra, resistente a dano" },
  { id: "poisoned", name: "Envenenado", effect: "Desvantagem em ataques e testes de habilidade" },
  { id: "prone", name: "Caído", effect: "Desvantagem em ataques, ataques corpo a corpo têm vantagem contra" },
  { id: "restrained", name: "Contido", effect: "Velocidade = 0, desvantagem em ataques e DES" },
  { id: "stunned", name: "Atordoado", effect: "Incapacitado, testes de FOR/DES falham automaticamente" },
  { id: "unconscious", name: "Inconsciente", effect: "Incapacitado, caído, testes de FOR/DES falham" },
];

export const ConditionsPanel = ({ roomId, players, isGM }: ConditionsPanelProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [selectedCondition, setSelectedCondition] = useState<string>("");
  const { toast } = useToast();

  const addCondition = async () => {
    if (!selectedPlayer || !selectedCondition || !isGM) return;

    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return;

    const currentConditions = (player.conditions as any[]) || [];
    const condition = D5E_CONDITIONS.find(c => c.id === selectedCondition);
    
    if (!condition) return;
    if (currentConditions.some((c: any) => c.id === selectedCondition)) {
      toast({
        title: "Condição já aplicada",
        description: `${player.characters?.name} já possui esta condição`,
        variant: "destructive",
      });
      return;
    }

    const updatedConditions = [...currentConditions, { 
      id: condition.id, 
      name: condition.name,
      appliedAt: new Date().toISOString()
    }];

    const { error } = await supabase
      .from("room_players")
      .update({ conditions: updatedConditions })
      .eq("id", selectedPlayer);

    if (error) {
      console.error("Error adding condition:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar a condição",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Condição aplicada!",
      description: `${condition.name} aplicada a ${player.characters?.name}`,
    });

    setSelectedCondition("");
  };

  const removeCondition = async (playerId: string, conditionId: string) => {
    if (!isGM) return;

    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const currentConditions = (player.conditions as any[]) || [];
    const updatedConditions = currentConditions.filter((c: any) => c.id !== conditionId);

    const { error } = await supabase
      .from("room_players")
      .update({ conditions: updatedConditions })
      .eq("id", playerId);

    if (error) {
      console.error("Error removing condition:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a condição",
        variant: "destructive",
      });
      return;
    }

    const condition = D5E_CONDITIONS.find(c => c.id === conditionId);
    toast({
      title: "Condição removida",
      description: `${condition?.name} removida de ${player.characters?.name}`,
    });
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Condições D&D 5e
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGM && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold">Aplicar Condição (GM)</h4>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione personagem..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {players.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.characters?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione condição..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50 max-h-[300px]">
                {D5E_CONDITIONS.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.effect}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={addCondition} 
              disabled={!selectedPlayer || !selectedCondition}
              className="w-full"
            >
              Aplicar Condição
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Condições Ativas</h4>
          {players.map(player => {
            const conditions = (player.conditions as any[]) || [];
            if (conditions.length === 0) return null;

            return (
              <div key={player.id} className="p-3 bg-background/50 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{player.characters?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    HP: {player.characters?.current_hp}/{player.characters?.max_hp}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {conditions.map((condition: any) => {
                    const conditionDef = D5E_CONDITIONS.find(c => c.id === condition.id);
                    return (
                      <Badge 
                        key={condition.id} 
                        variant="destructive"
                        className="flex items-center gap-1"
                      >
                        {conditionDef?.name || condition.name}
                        {isGM && (
                          <button
                            onClick={() => removeCondition(player.id, condition.id)}
                            className="ml-1 hover:bg-destructive-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    );
                  })}
                </div>
                {conditions.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {conditions.map((c: any) => {
                      const def = D5E_CONDITIONS.find(d => d.id === c.id);
                      return def ? <div key={c.id}>• {def.effect}</div> : null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {players.every(p => ((p.conditions as any[]) || []).length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma condição ativa
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
