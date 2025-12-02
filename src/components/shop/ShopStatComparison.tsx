import { Sword, Shield, ArrowUp, ArrowDown, Minus, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface ShopStatComparisonProps {
  shopItem: {
    atk: number;
    def: number;
    type: string;
  };
  equippedItem?: {
    atk: number;
    def: number;
    name: string;
  } | null;
}

export const ShopStatComparison = ({ shopItem, equippedItem }: ShopStatComparisonProps) => {
  if (!equippedItem) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-4 h-4" />
          <span>Nenhum item equipado para comparar</span>
        </div>
      </div>
    );
  }

  const atkDiff = shopItem.atk - (equippedItem.atk || 0);
  const defDiff = shopItem.def - (equippedItem.def || 0);

  const StatRow = ({ 
    label, 
    icon: Icon, 
    current, 
    newVal, 
    diff, 
    color 
  }: { 
    label: string; 
    icon: any; 
    current: number; 
    newVal: number; 
    diff: number;
    color: string;
  }) => {
    const isPositive = diff > 0;
    const isNegative = diff < 0;
    const DiffIcon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;
    const diffColor = isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-muted-foreground";

    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{current}</span>
          <motion.div 
            className="flex items-center gap-1"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <span className="text-muted-foreground">→</span>
            <span className={`text-sm font-bold ${newVal > current ? "text-green-400" : newVal < current ? "text-red-400" : ""}`}>
              {newVal}
            </span>
          </motion.div>
          {diff !== 0 && (
            <motion.div 
              className={`flex items-center gap-0.5 ${diffColor} text-xs font-bold`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <DiffIcon className="w-3 h-3" />
              {Math.abs(diff)}
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      className="p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <TrendingUp className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Comparação com item equipado</span>
      </div>
      
      <div className="text-xs text-muted-foreground mb-2">
        Item atual: <span className="font-medium text-foreground">{equippedItem.name}</span>
      </div>

      <div className="divide-y divide-border/30">
        {(shopItem.atk > 0 || equippedItem.atk > 0) && (
          <StatRow
            label="Ataque"
            icon={Sword}
            current={equippedItem.atk || 0}
            newVal={shopItem.atk}
            diff={atkDiff}
            color="text-red-400"
          />
        )}
        {(shopItem.def > 0 || equippedItem.def > 0) && (
          <StatRow
            label="Defesa"
            icon={Shield}
            current={equippedItem.def || 0}
            newVal={shopItem.def}
            diff={defDiff}
            color="text-blue-400"
          />
        )}
      </div>

      {/* Overall verdict */}
      <motion.div 
        className="mt-3 pt-2 border-t border-border/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {atkDiff + defDiff > 0 ? (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <ArrowUp className="w-4 h-4" />
            <span className="font-medium">Melhoria geral de stats</span>
          </div>
        ) : atkDiff + defDiff < 0 ? (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <ArrowDown className="w-4 h-4" />
            <span className="font-medium">Redução geral de stats</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Minus className="w-4 h-4" />
            <span className="font-medium">Stats equivalentes</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
