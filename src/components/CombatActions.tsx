import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Swords, Sparkles, Shield, Wind, Users, Heart, Zap } from "lucide-react";
import { RoomPlayer } from "@/hooks/useRoom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CombatActionsProps {
  roomId: string;
  currentPlayerId: string;
  availablePlayers: RoomPlayer[];
  isYourTurn: boolean;
}

export const CombatActions = ({ roomId, currentPlayerId, availablePlayers, isYourTurn }: CombatActionsProps) => {
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<string>("1");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const currentPlayer = availablePlayers.find(p => p.id === currentPlayerId);
  const character = currentPlayer?.characters;

  const handleAction = async (actionType: string) => {
    if (!isYourTurn) {
      toast({
        title: "Não é seu turno!",
        description: "Aguarde sua vez de agir",
        variant: "destructive",
      });
      return;
    }

    if ((actionType === "attack" || actionType === "cast_spell" || actionType === "help") && !selectedTarget) {
      toast({
        title: "Selecione um alvo",
        description: "Você precisa escolher um alvo para esta ação",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("combat-action", {
        body: {
          actionType,
          roomId,
          actorId: currentPlayerId,
          targetId: selectedTarget || null,
          spellLevel: actionType === "cast_spell" ? parseInt(selectedSpellLevel) : null,
        },
      });

      if (error) throw error;

      toast({
        title: "Ação realizada!",
        description: "Verifique o log de combate",
      });

      // If there's a narrative, show it
      if (data?.narrative) {
        setTimeout(() => {
          toast({
            title: "🎭 Voz do Destino",
            description: data.narrative,
            duration: 8000,
          });
        }, 500);
      }

      setSelectedTarget("");
    } catch (error) {
      console.error("Error executing action:", error);
      toast({
        title: "Erro na ação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!character) {
    return null;
  }

  const spellSlots = character.spell_slots || {};
  const currentSpellSlots = character.current_spell_slots || {};
  const hasSpells = Object.values(spellSlots).some((slots: any) => slots > 0);

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Ações de Combate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isYourTurn && (
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Aguardando seu turno...</p>
          </div>
        )}

        {/* Target Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecionar Alvo</label>
          <Select value={selectedTarget} onValueChange={setSelectedTarget} disabled={!isYourTurn}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Escolha um alvo..." />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              {availablePlayers
                .filter(p => p.id !== currentPlayerId)
                .map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.characters?.name} (HP: {p.characters?.current_hp}/{p.characters?.max_hp})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Standard Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleAction("attack")}
            disabled={!isYourTurn || isProcessing}
            className="flex items-center gap-2"
            variant="default"
          >
            <Swords className="w-4 h-4" />
            Atacar
          </Button>

          {hasSpells && (
            <Button
              onClick={() => handleAction("cast_spell")}
              disabled={!isYourTurn || isProcessing}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <Sparkles className="w-4 h-4" />
              Lançar Magia
            </Button>
          )}

          <Button
            onClick={() => handleAction("dodge")}
            disabled={!isYourTurn || isProcessing}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Shield className="w-4 h-4" />
            Esquivar
          </Button>

          <Button
            onClick={() => handleAction("dash")}
            disabled={!isYourTurn || isProcessing}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Wind className="w-4 h-4" />
            Correr
          </Button>

          <Button
            onClick={() => handleAction("disengage")}
            disabled={!isYourTurn || isProcessing}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Heart className="w-4 h-4" />
            Desengajar
          </Button>

          <Button
            onClick={() => handleAction("help")}
            disabled={!isYourTurn || isProcessing}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Users className="w-4 h-4" />
            Ajudar
          </Button>
        </div>

        {/* Spell Slot Selection */}
        {hasSpells && (
          <div className="space-y-2 pt-2 border-t">
            <label className="text-sm font-medium">Nível da Magia</label>
            <Select value={selectedSpellLevel} onValueChange={setSelectedSpellLevel} disabled={!isYourTurn}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
                  const available = currentSpellSlots[level] || 0;
                  const max = spellSlots[level] || 0;
                  if (max === 0) return null;
                  
                  return (
                    <SelectItem key={level} value={level.toString()} disabled={available === 0}>
                      Nível {level} ({available}/{max} slots)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
