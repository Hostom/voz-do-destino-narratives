import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sword, Shield, Beaker, Package } from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  rarity: string;
  type: string;
  atk: number;
  def: number;
  price: number;
  description: string;
  stock?: number; // -1 for unlimited, number for limited stock
}

interface ShopItemCardProps {
  item: ShopItem;
  onClick: () => void;
}

const rarityColors: Record<string, string> = {
  common: "text-gray-400 border-gray-500",
  uncommon: "text-green-400 border-green-500",
  rare: "text-blue-400 border-blue-500",
  very_rare: "text-purple-400 border-purple-500",
  legendary: "text-yellow-400 border-yellow-500",
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
};

export function ShopItemCard({ item, onClick }: ShopItemCardProps) {
  const rarityClass = rarityColors[item.rarity] || rarityColors.common;
  const TypeIcon = typeIcons[item.type] || Package;

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-all border-2 ${rarityClass}`}
      onClick={onClick}
    >
      <CardContent className="p-2.5 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <TypeIcon className="w-4 h-4 flex-shrink-0" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className={`font-semibold text-xs ${rarityClass.split(' ')[0]} truncate cursor-help`}>
                    {item.name}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{item.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            <Badge variant="outline" className={`${rarityClass} text-[9px] px-1 py-0 leading-tight`}>
              {rarityLabels[item.rarity]}
            </Badge>
            {item.stock !== undefined && item.stock !== -1 && (
              <Badge 
                variant={item.stock > 5 ? "outline" : item.stock > 0 ? "secondary" : "destructive"}
                className="text-[9px] px-1 py-0 leading-tight"
              >
                {item.stock > 0 ? `${item.stock}` : "0"}
              </Badge>
            )}
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight cursor-help">
                {item.description}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{item.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex gap-1.5 text-[10px]">
            {item.atk > 0 && (
              <span className="text-red-400">⚔️{item.atk}</span>
            )}
            {item.def > 0 && (
              <span className="text-blue-400">🛡️{item.def}</span>
            )}
          </div>
          <span className="text-xs font-bold text-yellow-500 whitespace-nowrap">
            {item.price}🪙
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
