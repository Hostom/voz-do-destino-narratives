import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon className="w-5 h-5" />
            <h3 className={`font-semibold ${rarityClass.split(' ')[0]}`}>
              {item.name}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={rarityClass}>
              {rarityLabels[item.rarity]}
            </Badge>
            {item.stock !== undefined && item.stock !== -1 && (
              <Badge 
                variant={item.stock > 5 ? "outline" : item.stock > 0 ? "secondary" : "destructive"}
                className="text-xs"
              >
                {item.stock > 0 ? `${item.stock} disponível` : "Sem estoque"}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-3 text-sm">
            {item.atk > 0 && (
              <span className="text-red-400">⚔️ {item.atk}</span>
            )}
            {item.def > 0 && (
              <span className="text-blue-400">🛡️ {item.def}</span>
            )}
          </div>
          <span className="text-lg font-bold text-yellow-500">
            {item.price} 🪙
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
