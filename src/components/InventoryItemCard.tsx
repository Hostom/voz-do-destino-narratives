import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sword, Shield, Beaker, Package, Sparkles, Check, X, ArrowRightLeft, Trash2 } from "lucide-react";

interface InventoryItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  weight: number;
  description: string | null;
  equipped: boolean;
  properties?: any;
}

interface InventoryItemCardProps {
  item: InventoryItem;
  onEquip: () => void;
  onDelete: () => void;
  onTrade?: () => void;
  canEquip: boolean;
  canTrade: boolean;
}

const typeIcons: Record<string, any> = {
  weapon: Sword,
  arma: Sword,
  armor: Shield,
  armadura: Shield,
  shield: Shield,
  escudo: Shield,
  potion: Beaker,
  pocao: Beaker,
  consumable: Beaker,
  magic_item: Sparkles,
  misc: Package,
};

const rarityColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400", glow: "" },
  uncommon: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-400", glow: "shadow-green-500/20" },
  rare: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", glow: "shadow-blue-500/20" },
  very_rare: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", glow: "shadow-purple-500/30" },
  legendary: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400", glow: "shadow-yellow-500/40 shadow-lg" },
};

const rarityLabels: Record<string, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  very_rare: "Muito Raro",
  legendary: "Lendário",
};

export const InventoryItemCard = ({ 
  item, 
  onEquip, 
  onDelete, 
  onTrade,
  canEquip, 
  canTrade 
}: InventoryItemCardProps) => {
  const TypeIcon = typeIcons[item.item_type.toLowerCase()] || Package;
  const rarity = item.properties?.rarity || "common";
  const colors = rarityColors[rarity] || rarityColors.common;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`relative overflow-hidden transition-all duration-300 ${colors.bg} ${colors.border} border-2 ${colors.glow} ${
          item.equipped ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
        }`}
      >
        {/* Equipped indicator */}
        {item.equipped && (
          <div className="absolute top-0 right-0">
            <div className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
              <Check className="w-3 h-3" />
              EQUIPADO
            </div>
          </div>
        )}

        <div className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start gap-2">
            <div className={`p-2 rounded-lg ${colors.bg} ${colors.border} border`}>
              <TypeIcon className={`w-5 h-5 ${colors.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className={`font-bold text-sm truncate ${colors.text}`}>
                      {item.item_name}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.item_name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={`${colors.text} ${colors.border} text-[9px] px-1.5 py-0`}>
                  {rarityLabels[rarity]}
                </Badge>
                {item.quantity > 1 && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                    x{item.quantity}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
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
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs">
            {item.properties?.atk > 0 && (
              <div className="flex items-center gap-1 text-red-400">
                <Sword className="w-3 h-3" />
                <span className="font-bold">+{item.properties.atk}</span>
              </div>
            )}
            {item.properties?.def > 0 && (
              <div className="flex items-center gap-1 text-blue-400">
                <Shield className="w-3 h-3" />
                <span className="font-bold">+{item.properties.def}</span>
              </div>
            )}
            <div className="text-muted-foreground ml-auto">
              {(item.weight * item.quantity).toFixed(1)} lb
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 pt-1 border-t border-border/50">
            {canEquip && (
              <Button
                size="sm"
                variant={item.equipped ? "default" : "outline"}
                onClick={onEquip}
                className="flex-1 h-7 text-[10px]"
              >
                {item.equipped ? (
                  <>
                    <X className="w-3 h-3 mr-1" />
                    Desequipar
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Equipar
                  </>
                )}
              </Button>
            )}
            {canTrade && onTrade && (
              <Button
                size="sm"
                variant="outline"
                onClick={onTrade}
                className="h-7 px-2"
              >
                <ArrowRightLeft className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-7 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
