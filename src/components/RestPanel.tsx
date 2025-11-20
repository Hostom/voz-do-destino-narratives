import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Coffee, Heart, Sparkles, Dices } from "lucide-react";
import { RoomPlayer } from "@/hooks/useRoom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RestPanelProps {
  roomId: string;
  players: RoomPlayer[];
  currentUserId: string | null;
}

export const RestPanel = ({ roomId, players, currentUserId }: RestPanelProps) => {
  const [isResting, setIsResting] = useState(false);
  const { toast } = useToast();

  const currentPlayer = players.find(p => p.user_id === currentUserId);
  const character = currentPlayer?.characters;

  const handleShortRest = async () => {
    if (!character || !currentPlayer) return;

    setIsResting(true);
    try {
      // Check if character has hit dice available
      const currentHitDice = (character as any).current_hit_dice || 0;
      if (currentHitDice <= 0) {
        toast({
          title: "Sem dados de vida",
          description: "Você não tem dados de vida disponíveis. Faça um descanso longo.",
          variant: "destructive",
        });
        setIsResting(false);
        return;
      }

      await rollHitDice();
    } finally {
      setIsResting(false);
    }
  };

  const rollHitDice = async () => {
    if (!character || !currentPlayer) return;

    const currentHitDice = (character as any).current_hit_dice || 0;
    if (currentHitDice <= 0) {
      toast({
        title: "Sem dados de vida",
        description: "Você não tem dados de vida disponíveis.",
        variant: "destructive",
      });
      return;
    }

    // Roll hit dice
    const hitDiceType = (character as any).hit_dice || "1d8";
    const diceSize = parseInt(hitDiceType.split("d")[1]);
    const roll = Math.floor(Math.random() * diceSize) + 1;
    
    // Add Constitution modifier
    const conMod = Math.floor((character.constitution - 10) / 2);
    const healAmount = Math.max(1, roll + conMod);
    
    // Calculate new HP
    const newHp = Math.min(character.max_hp, character.current_hp + healAmount);
    const actualHealing = newHp - character.current_hp;

    // Update character
    const { error } = await supabase
      .from("characters")
      .update({
        current_hp: newHp,
        current_hit_dice: currentHitDice - 1,
      })
      .eq("id", character.id);

    if (error) throw error;

    toast({
      title: "🎲 Dado de Vida Rolado!",
      description: `Você rolou ${roll} + ${conMod} (CON) e recuperou ${actualHealing} HP. Dados de vida restantes: ${currentHitDice - 1}/${character.level}`,
    });
  };

  const handleLongRest = async () => {
    if (!character || !currentPlayer) return;

    setIsResting(true);
    try {
      // Long rest restores:
      // - All HP
      // - All spell slots
      // - Half of hit dice (minimum 1)
      const restoredHitDice = Math.max(1, Math.floor(character.level / 2));
      const newHitDice = Math.min(character.level, ((character as any).current_hit_dice || 0) + restoredHitDice);

      const { error } = await supabase
        .from("characters")
        .update({
          current_hp: character.max_hp,
          current_spell_slots: character.spell_slots,
          current_hit_dice: newHitDice,
        })
        .eq("id", character.id);

      if (error) throw error;

      // Remove conditions
      await supabase
        .from("room_players")
        .update({ conditions: [] })
        .eq("id", currentPlayer.id);

      const hpRestored = character.max_hp - character.current_hp;
      const spellSlotsRestored = Object.values(character.spell_slots || {}).reduce((a: number, b: any) => a + b, 0);

      toast({
        title: "🌙 Descanso Longo Completo!",
        description: `${character.name} descansou profundamente. HP restaurado: ${hpRestored}, Slots de magia: ${spellSlotsRestored}, Dados de vida: +${restoredHitDice}. Todas as condições removidas.`,
        duration: 6000,
      });
    } catch (error) {
      console.error("Error during long rest:", error);
      toast({
        title: "Erro",
        description: "Não foi possível completar o descanso",
        variant: "destructive",
      });
    } finally {
      setIsResting(false);
    }
  };

  if (!character) {
    return null;
  }

  const hpPercent = (character.current_hp / character.max_hp) * 100;
  const hitDicePercent = (((character as any).current_hit_dice || 0) / character.level) * 100;
  
  const currentSpellSlots = character.current_spell_slots || {};
  const maxSpellSlots = character.spell_slots || {};
  const hasSpells = Object.values(maxSpellSlots).some((slots: any) => slots > 0);
  const spellSlotsUsed = Object.entries(maxSpellSlots).some(([level, max]: [string, any]) => {
    const current = (currentSpellSlots as any)[level] || 0;
    return current < max;
  });

  const needsRest = hpPercent < 100 || spellSlotsUsed || ((character as any).current_hit_dice || 0) < character.level;

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Moon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
          <span className="truncate">Sistema de Descanso</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pb-4">
        {/* Character Status */}
        <div className="p-4 bg-background/50 rounded-lg border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{character.name}</span>
            <Badge variant={needsRest ? "destructive" : "default"}>
              {needsRest ? "Precisa Descansar" : "Descansado"}
            </Badge>
          </div>

          {/* HP Bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-destructive" />
                Pontos de Vida
              </span>
              <span className="font-semibold">
                {character.current_hp}/{character.max_hp}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-destructive h-2 rounded-full transition-all"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Hit Dice Bar */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1">
                <Dices className="w-4 h-4 text-primary" />
                Dados de Vida ({(character as any).hit_dice || "1d8"})
              </span>
              <span className="font-semibold">
                {(character as any).current_hit_dice || 0}/{character.level}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${hitDicePercent}%` }}
              />
            </div>
          </div>

          {/* Spell Slots */}
          {hasSpells && (
            <div>
              <div className="flex items-center gap-1 text-sm mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Espaços de Magia</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(maxSpellSlots).map(([level, max]: [string, any]) => {
                  if (max === 0) return null;
                  const current = (currentSpellSlots as any)[level] || 0;
                  return (
                    <div key={level} className="text-xs">
                      <span className="text-muted-foreground">Nível {level}:</span>
                      <span className="ml-1 font-semibold">
                        {current}/{max}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rest Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleShortRest}
            disabled={isResting || ((character as any).current_hit_dice || 0) <= 0}
            className="flex flex-col items-center gap-2 h-auto py-4"
            variant="outline"
          >
            <Coffee className="w-6 h-6" />
            <div className="text-center">
              <div className="font-semibold">Descanso Curto</div>
              <div className="text-xs text-muted-foreground">
                Gasta 1 dado de vida
              </div>
            </div>
          </Button>

          <Button
            onClick={handleLongRest}
            disabled={isResting}
            className="flex flex-col items-center gap-2 h-auto py-4"
            variant="outline"
          >
            <Moon className="w-6 h-6" />
            <div className="text-center">
              <div className="font-semibold">Descanso Longo</div>
              <div className="text-xs text-muted-foreground">
                Restaura tudo
              </div>
            </div>
          </Button>
        </div>

        {/* Roll Hit Dice Button */}
        <Button
          onClick={rollHitDice}
          disabled={isResting || ((character as any).current_hit_dice || 0) <= 0}
          className="w-full"
          variant="secondary"
        >
          <Dices className="w-4 h-4 mr-2" />
          Rolar Dado de Vida (Recuperar HP)
        </Button>

        {/* Rest Info */}
        <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
          <p><strong>🎲 Rolar Dado de Vida:</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Use para recuperar HP quando precisar</li>
            <li>Rola o dado + modificador de Constituição</li>
            <li>Dados de vida recuperam após descanso longo</li>
          </ul>
          <p className="mt-2"><strong>☕ Descanso Curto (1 hora):</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Mesmo efeito de rolar dado de vida</li>
          </ul>
          <p className="mt-2"><strong>🌙 Descanso Longo (8 horas):</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Restaura todo HP</li>
            <li>Restaura todos os espaços de magia</li>
            <li>Recupera metade dos dados de vida</li>
            <li>Remove todas as condições</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
