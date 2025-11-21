import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sword, Shield, Hammer, Droplet, Package, Weight } from "lucide-react";
import { ShopItem } from "./parseItemList";

interface ItemModalProps {
  item: ShopItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getItemIcon = (type: string | null) => {
  const iconClass = "w-6 h-6";
  switch (type) {
    case "weapon":
      return <Sword className={iconClass} />;
    case "armor":
      return <Shield className={iconClass} />;
    case "tool":
      return <Hammer className={iconClass} />;
    case "consumable":
      return <Droplet className={iconClass} />;
    default:
      return <Package className={iconClass} />;
  }
};

const getRarityColor = (rarity: string | null) => {
  switch (rarity?.toLowerCase()) {
    case "legendary":
      return "text-orange-500 border-orange-500";
    case "very rare":
      return "text-purple-500 border-purple-500";
    case "rare":
      return "text-blue-500 border-blue-500";
    case "uncommon":
      return "text-green-500 border-green-500";
    case "common":
      return "text-gray-500 border-gray-500";
    default:
      return "text-muted-foreground border-border";
  }
};

export const ItemModal = ({ item, open, onOpenChange }: ItemModalProps) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-2">
            <div className={`p-3 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border-2 ${getRarityColor(item.rarity)}`}>
              {getItemIcon(item.type)}
            </div>
            
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{item.name}</DialogTitle>
              
              <div className="flex flex-wrap gap-2">
                {item.type && (
                  <Badge variant="secondary" className="capitalize">
                    {item.type}
                  </Badge>
                )}
                
                {item.rarity && (
                  <Badge variant="outline" className={`capitalize ${getRarityColor(item.rarity)}`}>
                    {item.rarity}
                  </Badge>
                )}
                
                {item.price && (
                  <Badge variant="default" className="text-sm font-bold">
                    💰 {item.price}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DialogDescription className="text-base text-foreground/90 leading-relaxed pt-2">
            {item.description}
          </DialogDescription>
        </DialogHeader>
        
        {(item.stats.length > 0 || item.weight) && (
          <>
            <Separator className="my-4" />
            
            <div className="space-y-3">
              {item.stats.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Atributos & Estatísticas
                  </h4>
                  <div className="space-y-1">
                    {item.stats.map((stat, index) => (
                      <div
                        key={index}
                        className="bg-secondary/50 rounded-md px-3 py-2 text-sm font-medium flex items-center gap-2"
                      >
                        <span className="text-primary">•</span>
                        <span>{stat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {item.weight && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Weight className="w-4 h-4" />
                  <span>Peso: {item.weight}</span>
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground italic">
            💡 Este item foi oferecido pelo Mestre do Jogo. Entre em contato com o Mestre para realizar transações.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
