import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sword, Shield, Beaker, Package, Sparkles, Coins } from "lucide-react";
import { motion } from "framer-motion";

interface ShopItem {
  id: string;
  name: string;
  rarity: string;
  type: string;
  atk: number;
  def: number;
  price: number;
  description: string;
  stock?: number;
}

interface ShopItemCardProps {
  item: ShopItem;
  onClick: () => void;
}

const rarityStyles: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: "bg-gray-500/5", border: "border-gray-500/30", text: "text-gray-400", glow: "" },
  uncommon: { bg: "bg-green-500/10", border: "border-green-500/40", text: "text-green-400", glow: "hover:shadow-green-500/20" },
  rare: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-400", glow: "hover:shadow-blue-500/20" },
  very_rare: { bg: "bg-purple-500/10", border: "border-purple-500/40", text: "text-purple-400", glow: "hover:shadow-purple-500/30" },
  legendary: { bg: "bg-gradient-to-br from-yellow-500/15 to-amber-500/10", border: "border-yellow-500/50", text: "text-yellow-400", glow: "hover:shadow-yellow-500/30 shadow-lg" },
};

const rarityLabels: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  very_rare: "Muito Raro",
  legendary: "Lendário",
};

const typeIcons: Record<string, any> = {
  weapon: Sword,
  armor: Shield,
  consumable: Beaker,
  misc: Package,
  magic_item: Sparkles,
};

export function ShopItemCard({ item, onClick }: ShopItemCardProps) {
  const styles = rarityStyles[item.rarity] || rarityStyles.common;
  const TypeIcon = typeIcons[item.type] || Package;
  const isOutOfStock = item.stock !== undefined && item.stock !== -1 && item.stock <= 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card 
        className={`cursor-pointer transition-all duration-300 border-2 overflow-hidden ${styles.bg} ${styles.border} ${styles.glow} hover:shadow-lg ${
          isOutOfStock ? "opacity-50 grayscale" : ""
        }`}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start gap-2">
            <div className={`p-2 rounded-lg ${styles.bg} border ${styles.border}`}>
              <TypeIcon className={`w-5 h-5 ${styles.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className={`font-bold text-sm truncate ${styles.text}`}>
                      {item.name}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className={`${styles.text} ${styles.border} text-[9px] px-1.5 py-0`}>
                  {rarityLabels[item.rarity]}
                </Badge>
                {item.stock !== undefined && item.stock !== -1 && (
                  <Badge 
                    variant={item.stock > 5 ? "secondary" : item.stock > 0 ? "outline" : "destructive"}
                    className="text-[9px] px-1.5 py-0"
                  >
                    {item.stock > 0 ? `${item.stock}` : "Esgotado"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-[10px] text-muted-foreground line-clamp-2 cursor-help">
                  {item.description}
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{item.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Stats & Price */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex gap-2">
              {item.atk > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                  <Sword className="w-3 h-3" />
                  <span className="text-xs font-bold">+{item.atk}</span>
                </div>
              )}
              {item.def > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                  <Shield className="w-3 h-3" />
                  <span className="text-xs font-bold">+{item.def}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-yellow-500 font-bold">
              <Coins className="w-4 h-4" />
              <span className="text-sm">{item.price}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
