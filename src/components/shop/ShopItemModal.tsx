import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShopItem } from "@/lib/shop-pricing";
import { Package, Coins, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRarityColor, getRarityBorderColor, getQualityStars } from "@/lib/shop-pricing";

interface ShopItemModalProps {
  item: ShopItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShopItemModal = ({ item, open, onOpenChange }: ShopItemModalProps) => {
  if (!item) return null;

  const rarityColor = getRarityColor(item.rarity);
  const borderColor = getRarityBorderColor(item.rarity);
  const qualityStars = getQualityStars(item.quality);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center border-2 ${borderColor}`}>
              <Package className={`h-8 w-8 ${rarityColor}`} />
            </div>
            <div className="flex-1">
              <DialogTitle className={`text-2xl ${rarityColor} mb-2`}>
                {item.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  {item.rarity}
                </Badge>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < qualityStars
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="text-lg font-bold">Preço</span>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {item.finalPrice} PO
            </Badge>
          </div>
          
          <Separator />
          
          {item.description && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Descrição
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {item.description}
              </p>
            </div>
          )}
          
          {Object.keys(item.attributes).length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Atributos
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(item.attributes).map(([key, value]) => (
                    <div key={key} className="bg-muted/50 p-2 rounded-md">
                      <span className="text-xs text-muted-foreground capitalize">
                        {key}:
                      </span>
                      <span className="text-sm font-semibold ml-1">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {item.stock >= 0 && (
            <>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">
                  Estoque disponível: <strong>{item.stock}</strong>
                </span>
              </div>
            </>
          )}
          
          <Separator />
          
          <Button className="w-full" size="lg" disabled>
            Comprar (Em breve)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
