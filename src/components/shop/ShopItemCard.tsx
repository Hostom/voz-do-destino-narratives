import { Card } from "@/components/ui/card";
import { ShopItem } from "@/utils/extractShopItems";
import { Package, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ShopItemCardProps {
  item: ShopItem;
  onClick: () => void;
}

export const ShopItemCard = ({ item, onClick }: ShopItemCardProps) => {
  return (
    <Card
      className="p-3 cursor-pointer hover:bg-accent/50 transition-all duration-200 border-primary/20 hover:border-primary/40 hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm text-foreground flex-1">
              {item.name}
            </h4>
            {item.price && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs shrink-0">
                <Coins className="h-3 w-3" />
                {item.price}
              </Badge>
            )}
          </div>
          {item.stats && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {item.stats}
            </p>
          )}
          {item.description && !item.stats && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

