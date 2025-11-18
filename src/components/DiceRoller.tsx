import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dices } from "lucide-react";
interface DiceRollerProps {
  onRoll: (result: number) => void;
}
export const DiceRoller = ({
  onRoll
}: DiceRollerProps) => {
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
  return <div className="flex items-center gap-4">
      
      
      {result !== null && <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-epic border border-primary/30 shadow-glow animate-in fade-in zoom-in duration-300">
          <span className="text-3xl font-bold text-gradient-epic">{result}</span>
        </div>}
    </div>;
};