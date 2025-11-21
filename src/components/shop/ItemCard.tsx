import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sword, Shield, Hammer, Droplet, Package } from "lucide-react";
import { ShopItem } from "./parseItemList";

interface ItemCardProps {
  item: ShopItem;
  onClick: () => void;
}

const getItemIcon = (type: string | null) => {
  switch (type) {
    case "weapon":
      return <Sword className="w-5 h-5" />;
    case "armor":
      return <Shield className="w-5 h-5" />;
    case "tool":
      return <Hammer className="w-5 h-5" />;
    case "consumable":
      return <Droplet className="w-5 h-5" />;
    default:
      return <Package className="w-5 h-5" />;
  }
};

const getRarityColor = (rarity: string | null) => {
  switch (rarity?.toLowerCase()) {
    case "legendary":
      return "bg-gradient-to-r from-orange-500 to-red-500";
    case "very rare":
      return "bg-gradient-to-r from-purple-500 to-pink-500";
    case "rare":
      return "bg-gradient-to-r from-blue-500 to-cyan-500";
    case "uncommon":
      return "bg-gradient-to-r from-green-500 to-emerald-500";
    case "common":
      return "bg-gradient-to-r from-gray-500 to-slate-500";
    default:
      return "bg-muted";
  }
};

export const ItemCard = ({ item, onClick }: ItemCardProps) => {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg hover:border-primary/50 bg-card/50 backdrop-blur"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${getRarityColor(item.rarity)} text-white`}>
            {getItemIcon(item.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 truncate">
              {item.name}
            </h3>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {item.description}
            </p>
            
            <div className="flex flex-wrap gap-1">
              {item.type && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {item.type}
                </Badge>
              )}
              
              {item.rarity && (
                <Badge variant="outline" className="text-xs capitalize">
                  {item.rarity}
                </Badge>
              )}
              
              {item.price && (
                <Badge variant="default" className="text-xs">
                  {item.price}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
