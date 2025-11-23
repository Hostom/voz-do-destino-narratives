import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sword, Shield, Coins } from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  rarity: string;
  type: string;
  atk: number;
  def: number;
  price: number;
  description: string;
  lore: string;
  stock?: number; // -1 for unlimited, number for limited stock
}

interface ShopItemModalProps {
  item: ShopItem;
  isOpen: boolean;
  onClose: () => void;
  characterId: string;
  roomId: string;
  onBuySuccess?: () => void;
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

export function ShopItemModal({
  item,
  isOpen,
  onClose,
  characterId,
  roomId,
  onBuySuccess,
}: ShopItemModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBuy = async () => {
    setIsLoading(true);
    try {
      // Check stock availability first
      if (item.stock !== undefined && item.stock !== -1 && item.stock <= 0) {
        toast.error('Item fora de estoque!');
        setIsLoading(false);
        return;
      }

      // Get current character gold
      const { data: character, error: charError } = await supabase
        .from('characters')
        .select('gold_pieces')
        .eq('id', characterId)
        .single();

      if (charError) throw charError;

      const currentGold = character.gold_pieces || 0;

      if (currentGold < item.price) {
        toast.error('Ouro insuficiente!');
        setIsLoading(false);
        return;
      }

      // Deduct gold
      const { error: goldError } = await supabase
        .from('characters')
        .update({ gold_pieces: currentGold - item.price })
        .eq('id', characterId);

      if (goldError) throw goldError;

      // Add item to inventory
      const { error: itemError } = await supabase
        .from('character_items')
        .insert({
          character_id: characterId,
          item_name: item.name,
          item_type: item.type,
          description: item.description,
          quantity: 1,
          weight: 0,
          properties: {
            atk: item.atk,
            def: item.def,
            rarity: item.rarity,
            lore: item.lore,
          },
        });

      if (itemError) throw itemError;

      // Decrement shop stock if not unlimited
      if (item.stock !== undefined && item.stock !== -1) {
        const { error: stockError } = await supabase
          .from('shop_items')
          .update({ stock: item.stock - 1 })
          .eq('item_id', item.id);

        if (stockError) {
          console.error('Failed to update stock:', stockError);
        }
      }

      // Record transaction
      const { error: transError } = await supabase
        .from('shop_transactions')
        .insert({
          character_id: characterId,
          room_id: roomId,
          player_id: (await supabase.auth.getUser()).data.user?.id || '',
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: 1,
        });

      if (transError) console.error('Transaction log error:', transError);

      toast.success(`${item.name} comprado por ${item.price} 🪙!`);
      onBuySuccess?.();
      onClose();
    } catch (error) {
      console.error('Buy error:', error);
      toast.error('Erro ao comprar item');
    } finally {
      setIsLoading(false);
    }
  };

  const rarityClass = rarityColors[item.rarity] || rarityColors.common;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className={`text-2xl ${rarityClass.split(' ')[0]}`}>
            {item.name}
          </DialogTitle>
          <DialogDescription>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className={`${rarityClass}`}>
                {rarityLabels[item.rarity]}
              </Badge>
              {item.stock !== undefined && item.stock !== -1 && (
                <Badge 
                  variant={item.stock > 5 ? "default" : item.stock > 0 ? "secondary" : "destructive"}
                >
                  {item.stock > 0 ? `${item.stock} em estoque` : "Sem estoque"}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="flex gap-6">
            {item.atk > 0 && (
              <div className="flex items-center gap-2">
                <Sword className="w-5 h-5 text-red-400" />
                <span className="text-lg font-semibold">{item.atk} Ataque</span>
              </div>
            )}
            {item.def > 0 && (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-semibold">{item.def} Defesa</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h4 className="font-semibold mb-2">Descrição</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>

          {/* Lore */}
          {item.lore && (
            <div>
              <h4 className="font-semibold mb-2">História</h4>
              <p className="text-sm text-muted-foreground italic">{item.lore}</p>
            </div>
          )}

          <Separator />

          {/* Price */}
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Preço:</span>
            <span className="flex items-center gap-2 text-yellow-500">
              <Coins className="w-5 h-5" />
              {item.price} 🪙
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleBuy} 
            disabled={isLoading || (item.stock !== undefined && item.stock !== -1 && item.stock <= 0)}
          >
            {isLoading ? 'Comprando...' : item.stock === 0 ? 'Sem Estoque' : 'Comprar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
