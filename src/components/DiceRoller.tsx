import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";

interface DiceRollerProps {
  onRoll: (result: number) => void;
}

export const DiceRoller = ({ onRoll }: DiceRollerProps) => {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const rollDice = () => {
    setRolling(true);
    setResult(null);

    // Animate for 1 second
    const rollInterval = setInterval(() => {
      setResult(Math.floor(Math.random() * 20) + 1);
    }, 50);

    setTimeout(() => {
      clearInterval(rollInterval);
      const finalResult = Math.floor(Math.random() * 20) + 1;
      setResult(finalResult);
      setRolling(false);
      onRoll(finalResult);
    }, 1000);
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={rollDice}
        disabled={rolling}
        variant="outline"
        className="border-primary/50 bg-card hover:bg-card/80 hover:border-primary transition-all"
      >
        <Dices className={`mr-2 h-4 w-4 ${rolling ? "animate-spin" : ""}`} />
        Rolar d20
      </Button>
      
      {result !== null && (
        <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-epic border border-primary/30 shadow-glow animate-in fade-in zoom-in duration-300">
          <span className="text-3xl font-bold text-gradient-epic">{result}</span>
        </div>
      )}
    </div>
  );
};
