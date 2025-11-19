import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dices } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DiceRollerProps {
  onRoll: (result: number) => void;
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

const calculateModifier = (abilityScore: number): number => {
  return Math.floor((abilityScore - 10) / 2);
};

export const DiceRoller = ({
  onRoll,
  roomId,
  characterName,
  characterStats
}: DiceRollerProps) => {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [selectedModifier, setSelectedModifier] = useState<string>("none");

  const rollDice = async () => {
    setRolling(true);
    setResult(null);

    // Animate for 1 second
    const rollInterval = setInterval(() => {
      setResult(Math.floor(Math.random() * 20) + 1);
    }, 50);
    
    setTimeout(async () => {
      clearInterval(rollInterval);
      const diceResult = Math.floor(Math.random() * 20) + 1;
      
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
      
      const total = diceResult + modifier;
      setResult(total);
      setRolling(false);
      onRoll(total);

      // Enviar resultado para o chat se houver roomId
      if (roomId && characterName) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const message = `🎲 Rolou d20: **${diceResult}**${modifierText} = **${total}**`;
          await supabase.from("room_chat_messages").insert({
            room_id: roomId,
            user_id: user.id,
            character_name: characterName,
            message: message,
          });
        }
      }
    }, 1000);
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
    <div className="flex items-center gap-4">
      {characterStats && (
        <Select value={selectedModifier} onValueChange={setSelectedModifier}>
          <SelectTrigger className="w-[200px]">
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
      )}
      
      <Button
        onClick={rollDice}
        disabled={rolling}
        className="gap-2"
      >
        <Dices className={rolling ? "animate-spin" : ""} />
        {rolling ? "Rolando..." : "Rolar d20"}
      </Button>
      
      {result !== null && (
        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-epic border border-primary/30 shadow-glow animate-in fade-in zoom-in duration-300">
          <span className="text-3xl font-bold text-gradient-epic">{result}</span>
        </div>
      )}
    </div>
  );
};