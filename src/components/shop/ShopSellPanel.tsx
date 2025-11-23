import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Coins, Package } from "lucide-react";

interface InventoryItem {
  id: string;
  item_name: string;
  item_type: string;
  description: string | null;
  quantity: number;
  weight: number;
  properties: any;
}

interface ShopSellPanelProps {
  characterId: string;
  roomId: string;
}

export const ShopSellPanel = ({ characterId, roomId }: ShopSellPanelProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();

    const channel = supabase
      .channel(`character-items-${characterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "character_items",
          filter: `character_id=eq.${characterId}`,
        },
        () => {
          loadInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const loadInventory = async () => {
    const { data, error } = await supabase
      .from("character_items")
      .select("*")
      .eq("character_id", characterId)
      .order("item_name");

    if (error) {
      console.error("Error loading inventory:", error);
      return;
    }

    setItems(data || []);
  };

  const calculateSellPrice = (item: InventoryItem): number => {
    // Check if item has original price in properties
    let basePrice = 10;
    
    if (item.properties?.price) {
      basePrice = item.properties.price;
    } else {
      // Fallback to type-based estimation
      if (item.item_type === "weapon") basePrice = 50;
      if (item.item_type === "armor") basePrice = 75;
      if (item.item_type === "consumable") basePrice = 25;
      if (item.item_type === "misc") basePrice = 10;
    }

    // Sell at 50% of value
    const sellPrice = Math.floor(basePrice * 0.5);

    return Math.max(1, sellPrice);
  };

  const handleSell = async (item: InventoryItem) => {
    setLoading(item.id);
    
    try {
      const sellPrice = calculateSellPrice(item);

      // Get character gold
      const { data: character, error: charError } = await supabase
        .from("characters")
        .select("gold_pieces")
        .eq("id", characterId)
        .single();

      if (charError) throw charError;

      // Add gold
      const { error: updateError } = await supabase
        .from("characters")
        .update({ gold_pieces: (character.gold_pieces || 0) + sellPrice })
        .eq("id", characterId);

      if (updateError) throw updateError;

      // Remove item from inventory (or decrease quantity)
      if (item.quantity > 1) {
        const { error: itemError } = await supabase
          .from("character_items")
          .update({ quantity: item.quantity - 1 })
          .eq("id", item.id);

        if (itemError) throw itemError;
      } else {
        const { error: deleteError } = await supabase
          .from("character_items")
          .delete()
          .eq("id", item.id);

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Item vendido!",
        description: `Você vendeu ${item.item_name} por ${sellPrice} 🪙`,
      });
    } catch (error) {
      console.error("Error selling item:", error);
      toast({
        title: "Erro ao vender",
        description: "Não foi possível vender o item.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Você não tem itens para vender.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[450px]">
      <div className="space-y-1.5 pr-4">
        {items.map((item) => {
          const sellPrice = calculateSellPrice(item);
          
          return (
            <div
              key={item.id}
              className="flex items-center gap-1.5 p-1.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-3 w-3 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1 flex-nowrap">
                  <h4 className="font-semibold text-[11px] truncate max-w-[80px]" title={item.item_name}>
                    {item.item_name}
                  </h4>
                  <Badge variant="outline" className="text-[9px] px-0.5 py-0 leading-tight flex-shrink-0">
                    {item.item_type}
                  </Badge>
                  {item.quantity > 1 && (
                    <Badge variant="secondary" className="text-[9px] px-0.5 py-0 leading-tight flex-shrink-0">
                      x{item.quantity}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-0.5">
                  <Coins className="h-3 w-3 text-yellow-500" />
                  <span className="text-[11px] font-bold">{sellPrice}</span>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleSell(item)}
                  disabled={loading === item.id}
                  className="h-6 px-2 text-[10px] flex-shrink-0"
                >
                  {loading === item.id ? "..." : "Vender"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
