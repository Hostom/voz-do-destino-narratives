import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Coins, Star } from "lucide-react";
import { ShopItem } from "@/lib/shop-pricing";
import { getRarityColor, getRarityBorderColor, getQualityStars } from "@/lib/shop-pricing";

interface ShopItemCardProps {
  item: ShopItem;
  onClick: () => void;
}

export const ShopItemCard = ({ item, onClick }: ShopItemCardProps) => {
  const rarityColor = getRarityColor(item.rarity);
  const borderColor = getRarityBorderColor(item.rarity);
  const qualityStars = getQualityStars(item.quality);

  return (
    <Card
      className={`p-4 cursor-pointer hover:bg-accent/50 transition-all duration-200 border-2 ${borderColor} hover:shadow-lg hover:scale-[1.02]`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border-2 ${borderColor}`}>
          <Package className={`h-6 w-6 ${rarityColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-bold text-base ${rarityColor} flex-1`}>
              {item.name}
            </h4>
            <Badge variant="outline" className="flex items-center gap-1 text-sm shrink-0">
              <Coins className="h-3 w-3" />
              {item.finalPrice} PO
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {item.rarity}
            </Badge>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < qualityStars
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
          
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
          
          {item.stock >= 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Estoque: {item.stock}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
