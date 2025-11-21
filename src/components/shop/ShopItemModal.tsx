import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShopItem } from "@/utils/extractShopItems";
import { Package, Coins } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface ShopItemModalProps {
  item: ShopItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShopItemModal = ({ item, open, onOpenChange }: ShopItemModalProps) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{item.name}</DialogTitle>
              {item.price && (
                <div className="mt-2">
                  <Badge variant="outline" className="flex items-center gap-1.5 text-sm">
                    <Coins className="h-4 w-4" />
                    {item.price}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {item.stats && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  {item.price ? "Informações" : "Estatísticas"}
                </h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {item.stats}
                </p>
              </div>
              {item.description && item.description !== item.stats && item.description !== item.price && (
                <Separator />
              )}
            </>
          )}
          
          {item.description && item.description !== item.stats && item.description !== item.price && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Descrição
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}
          
          {!item.stats && !item.description && !item.price && (
            <p className="text-sm text-muted-foreground italic">
              Nenhuma informação adicional disponível.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

