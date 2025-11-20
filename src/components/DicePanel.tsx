import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dices, Plus, Minus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DiceType {
  sides: number;
  label: string;
  color: string;
}

interface SelectedDice {
  sides: number;
  label: string;
  count: number;
}

interface DicePanelProps {
  roomId?: string;
  characterName?: string;
  characterStats?: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}

const DICE_TYPES: DiceType[] = [
  { sides: 4, label: "d4", color: "bg-blue-500" },
  { sides: 6, label: "d6", color: "bg-green-500" },
  { sides: 8, label: "d8", color: "bg-yellow-500" },
  { sides: 10, label: "d10", color: "bg-orange-500" },
  { sides: 12, label: "d12", color: "bg-red-500" },
  { sides: 20, label: "d20", color: "bg-purple-500" },
];

const calculateModifier = (abilityScore: number): number => {
  return Math.floor((abilityScore - 10) / 2);
};

export const DicePanel = ({ roomId, characterName, characterStats }: DicePanelProps) => {
  const [diceCount, setDiceCount] = useState(1);
  const [selectedDice, setSelectedDice] = useState<SelectedDice[]>([]);
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<{ dice: string; results: number[]; total: number } | null>(null);
  const [selectedModifier, setSelectedModifier] = useState<string>("none");
  const { toast } = useToast();

  const addDiceToSelection = (sides: number, label: string) => {
    const existing = selectedDice.find(d => d.sides === sides);
    if (existing) {
      setSelectedDice(selectedDice.map(d => 
        d.sides === sides ? { ...d, count: d.count + diceCount } : d
      ));
    } else {
      setSelectedDice([...selectedDice, { sides, label, count: diceCount }]);
    }
  };

  const removeDiceFromSelection = (sides: number) => {
    setSelectedDice(selectedDice.filter(d => d.sides !== sides));
  };

  const rollAllDice = async () => {
    if (rolling || selectedDice.length === 0) return;
    
    setRolling(true);
    setLastRoll(null);

    const allResults: { label: string; results: number[] }[] = [];
    let totalSum = 0;

    for (const dice of selectedDice) {
      const results: number[] = [];
      for (let i = 0; i < dice.count; i++) {
        const roll = Math.floor(Math.random() * dice.sides) + 1;
        results.push(roll);
        totalSum += roll;
      }
      allResults.push({ label: `${dice.count}${dice.label}`, results });
    }

    // Adiciona o modificador UMA VEZ ao total
    let modifier = 0;
    let modifierText = "";
    if (selectedModifier !== "none" && characterStats) {
      const stat = characterStats[selectedModifier as keyof typeof characterStats];
      modifier = calculateModifier(stat);
      const modifierLabel = {
        strength: "FOR",
        dexterity: "DES",
        constitution: "CON",
        intelligence: "INT",
        wisdom: "SAB",
        charisma: "CAR"
      }[selectedModifier];
      modifierText = ` + ${modifierLabel} (${modifier >= 0 ? '+' : ''}${modifier})`;
    }

    const finalTotal = totalSum + modifier;

    setTimeout(async () => {
      const diceDescription = allResults.map(r => r.label).join(" + ");
      const resultsDescription = allResults.map(r => `${r.label}: [${r.results.join(", ")}]`).join(" + ");
      
      setLastRoll({ 
        dice: diceDescription, 
        results: allResults.flatMap(r => r.results), 
        total: finalTotal 
      });
      setRolling(false);
      
      toast({
        title: `🎲 ${diceDescription}${modifierText}`,
        description: `Resultados: ${resultsDescription}${modifierText} = ${finalTotal}`,
      });

      // Envia para o chat do GM E notifica os jogadores
      if (roomId && characterName) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const message = `🎲 Rolou ${diceDescription}: ${resultsDescription}${modifierText} = **${finalTotal}**`;
          
          // 1. Envia para o chat dos jogadores (notificação pública)
          await supabase.from("room_chat_messages").insert({
            room_id: roomId,
            user_id: user.id,
            character_name: characterName,
            message: message,
          });

          // 2. Envia para o chat do GM (para o mestre ter contexto)
          await supabase.from("gm_messages").insert({
            room_id: roomId,
            player_id: user.id,
            character_name: characterName,
            sender: "player",
            content: message,
            type: "gm",
          });

          // 3. Chama a IA para processar a rolagem e responder
          console.log('Calling game-master for dice roll:', { roomId, characterName, message });
          
          try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/game-master`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                messages: [{ role: 'user', content: message }],
                roomId: roomId,
                characterName: characterName,
              }),
            });

            if (!response.ok) {
              console.error('Game master response error:', response.status);
            } else {
              // Consome o stream para garantir que a função execute completamente
              const reader = response.body?.getReader();
              if (reader) {
                while (true) {
                  const { done } = await reader.read();
                  if (done) break;
                }
              }
              console.log('Game-master function invoked successfully for dice roll');
            }
          } catch (error) {
            console.error('Error calling game-master:', error);
          }
        }
      }

      // Limpa a seleção após rolar
      setSelectedDice([]);
    }, 800);
  };

  const adjustDiceCount = (increment: boolean) => {
    if (increment && diceCount < 10) {
      setDiceCount(diceCount + 1);
    } else if (!increment && diceCount > 1) {
      setDiceCount(diceCount - 1);
    }
  };

  const modifierOptions = characterStats ? [
    { value: "none", label: "Sem modificador" },
    { value: "strength", label: `Força (${calculateModifier(characterStats.strength) >= 0 ? '+' : ''}${calculateModifier(characterStats.strength)})` },
    { value: "dexterity", label: `Destreza (${calculateModifier(characterStats.dexterity) >= 0 ? '+' : ''}${calculateModifier(characterStats.dexterity)})` },
    { value: "constitution", label: `Constituição (${calculateModifier(characterStats.constitution) >= 0 ? '+' : ''}${calculateModifier(characterStats.constitution)})` },
    { value: "intelligence", label: `Inteligência (${calculateModifier(characterStats.intelligence) >= 0 ? '+' : ''}${calculateModifier(characterStats.intelligence)})` },
    { value: "wisdom", label: `Sabedoria (${calculateModifier(characterStats.wisdom) >= 0 ? '+' : ''}${calculateModifier(characterStats.wisdom)})` },
    { value: "charisma", label: `Carisma (${calculateModifier(characterStats.charisma) >= 0 ? '+' : ''}${calculateModifier(characterStats.charisma)})` },
  ] : [];

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        {/* Dice count control */}
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm font-medium text-foreground">Quantidade de Dados</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustDiceCount(false)}
              disabled={diceCount <= 1 || rolling}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-lg font-bold text-primary w-8 text-center">{diceCount}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustDiceCount(true)}
              disabled={diceCount >= 10 || rolling}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Modifier selector */}
        {characterStats && (
          <div>
            <span className="text-xs md:text-sm font-medium text-foreground mb-2 block">Modificador (aplicado 1x ao total)</span>
            <Select value={selectedModifier} onValueChange={setSelectedModifier}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione modificador" />
              </SelectTrigger>
              <SelectContent>
                {modifierOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Dice buttons - Add to selection */}
        <div>
          <span className="text-xs md:text-sm font-medium text-foreground mb-2 block">Selecione os dados</span>
          <div className="grid grid-cols-3 gap-2">
            {DICE_TYPES.map(({ sides, label }) => (
              <Button
                key={sides}
                onClick={() => addDiceToSelection(sides, label)}
                disabled={rolling}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center gap-1 hover:border-primary transition-all"
              >
                <Dices className="h-5 w-5" />
                <span className="text-xs font-bold">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Selected dice display */}
        {selectedDice.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs md:text-sm font-medium text-foreground">Dados selecionados:</span>
            <div className="flex flex-wrap gap-2">
              {selectedDice.map((dice) => (
                <div
                  key={dice.sides}
                  className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 bg-primary/10 border border-primary/30 rounded-md"
                >
                  <span className="text-xs md:text-sm font-medium">
                    {dice.count}{dice.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => removeDiceFromSelection(dice.sides)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              onClick={rollAllDice}
              disabled={rolling}
              className="w-full gap-2 text-sm md:text-base"
            >
              <Dices className={rolling ? "animate-spin" : ""} />
              {rolling ? "Rolando..." : "Rolar Todos os Dados"}
            </Button>
          </div>
        )}

        {/* Last roll result */}
        {lastRoll && (
          <div className="flex items-center justify-center gap-2 md:gap-3 p-2 md:p-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{lastRoll.dice}</p>
              <p className="text-xs md:text-sm text-foreground">{lastRoll.results.join(" + ")}</p>
            </div>
            <div className="h-10 md:h-12 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl md:text-2xl font-bold text-primary">{lastRoll.total}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
