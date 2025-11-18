import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dices, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiceType {
  sides: number;
  label: string;
  color: string;
}

const DICE_TYPES: DiceType[] = [
  { sides: 4, label: "d4", color: "bg-blue-500" },
  { sides: 6, label: "d6", color: "bg-green-500" },
  { sides: 8, label: "d8", color: "bg-yellow-500" },
  { sides: 10, label: "d10", color: "bg-orange-500" },
  { sides: 12, label: "d12", color: "bg-red-500" },
  { sides: 20, label: "d20", color: "bg-purple-500" },
];

export const DicePanel = () => {
  const [diceCount, setDiceCount] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<{ dice: string; results: number[]; total: number } | null>(null);
  const { toast } = useToast();

  const rollDice = (sides: number, label: string) => {
    if (rolling) return;
    
    setRolling(true);
    setLastRoll(null);

    const results: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      results.push(Math.floor(Math.random() * sides) + 1);
    }

    setTimeout(() => {
      const total = results.reduce((sum, val) => sum + val, 0);
      setLastRoll({ dice: `${diceCount}${label}`, results, total });
      setRolling(false);
      
      toast({
        title: `🎲 ${diceCount}${label}`,
        description: `Resultados: ${results.join(", ")} = ${total}`,
      });
    }, 800);
  };

  const adjustDiceCount = (increment: boolean) => {
    if (increment && diceCount < 10) {
      setDiceCount(diceCount + 1);
    } else if (!increment && diceCount > 1) {
      setDiceCount(diceCount - 1);
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <div className="p-4 space-y-4">
        {/* Dice count control */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Quantidade de Dados</span>
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

        {/* Dice buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {DICE_TYPES.map(({ sides, label }) => (
            <Button
              key={sides}
              onClick={() => rollDice(sides, label)}
              disabled={rolling}
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-1 hover:border-primary transition-all"
            >
              <Dices className={`h-5 w-5 ${rolling ? "animate-spin" : ""}`} />
              <span className="text-xs font-bold">{label}</span>
            </Button>
          ))}
        </div>

        {/* Last roll result */}
        {lastRoll && (
          <div className="flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{lastRoll.dice}</p>
              <p className="text-sm text-foreground">{lastRoll.results.join(" + ")}</p>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary">{lastRoll.total}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
