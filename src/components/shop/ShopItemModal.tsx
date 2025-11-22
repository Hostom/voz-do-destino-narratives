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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ShopItemModalProps {
  item: ShopItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  roomId: string;
}

export const ShopItemModal = ({ item, open, onOpenChange, characterId, roomId }: ShopItemModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!item) return null;

  const rarityColor = getRarityColor(item.rarity);
  const borderColor = getRarityBorderColor(item.rarity);
  const qualityStars = getQualityStars(item.quality);

  const handleBuy = async () => {
    if (!characterId || !roomId) return;
    
    setLoading(true);
    try {
      // Get character data
      const { data: character, error: charError } = await supabase
        .from("characters")
        .select("gold_pieces")
        .eq("id", characterId)
        .single();

      if (charError) throw charError;

      const currentGold = character.gold_pieces || 0;

      // Check if enough gold
      if (currentGold < item.finalPrice) {
        toast({
          title: "Ouro insuficiente",
          description: `Você precisa de ${item.finalPrice} PO, mas só tem ${currentGold} PO.`,
          variant: "destructive",
        });
        return;
      }

      // Check stock
      if (item.stock === 0) {
        toast({
          title: "Sem estoque",
          description: "Este item não está mais disponível.",
          variant: "destructive",
        });
        return;
      }

      // Deduct gold
      const { error: updateError } = await supabase
        .from("characters")
        .update({ gold_pieces: currentGold - item.finalPrice })
        .eq("id", characterId);

      if (updateError) throw updateError;

      // Add item to inventory
      const { error: itemError } = await supabase
        .from("character_items")
        .insert({
          character_id: characterId,
          item_name: item.name,
          item_type: item.category || "misc",
          description: item.description,
          quantity: 1,
          weight: 0,
          properties: item.attributes,
        });

      if (itemError) throw itemError;

      // Update shop stock if limited
      if (item.stock > 0) {
        const { data: shopState } = await supabase
          .from("shop_states")
          .select("items")
          .eq("room_id", roomId)
          .single();

        if (shopState) {
          const items = shopState.items as any[];
          const updatedItems = items.map((i: any) => 
            i.id === item.id ? { ...i, stock: i.stock - 1 } : i
          );

          await supabase
            .from("shop_states")
            .update({ items: updatedItems })
            .eq("room_id", roomId);
        }
      }

      toast({
        title: "Compra realizada!",
        description: `${item.name} foi adicionado ao seu inventário.`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error buying item:", error);
      toast({
        title: "Erro na compra",
        description: "Não foi possível completar a compra.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleBuy}
            disabled={loading || item.stock === 0}
          >
            {loading ? "Comprando..." : item.stock === 0 ? "Sem estoque" : `Comprar por ${item.finalPrice} PO`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
