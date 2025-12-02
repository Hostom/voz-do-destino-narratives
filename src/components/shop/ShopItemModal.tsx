import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sword, Shield, Coins, ShoppingCart, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShopStatComparison } from "./ShopStatComparison";

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
  const [isPurchased, setIsPurchased] = useState(false);
  const [equippedItem, setEquippedItem] = useState<{ atk: number; def: number; name: string } | null>(null);

  // Load equipped item for comparison
  useEffect(() => {
    if (isOpen && characterId) {
      loadEquippedItem();
    }
  }, [isOpen, characterId, item.type]);

  const loadEquippedItem = async () => {
    try {
      const { data: items } = await supabase
        .from('character_items')
        .select('item_name, properties, item_type')
        .eq('character_id', characterId)
        .eq('equipped', true);

      if (items && items.length > 0) {
        // Find item of same type
        const sameTypeItem = items.find(i => 
          i.item_type === item.type || 
          (item.type === 'weapon' && ['weapon', 'arma'].includes(i.item_type)) ||
          (item.type === 'armor' && ['armor', 'armadura', 'shield', 'escudo'].includes(i.item_type))
        );
        
        if (sameTypeItem) {
          const props = sameTypeItem.properties as Record<string, any> | null;
          setEquippedItem({
            name: sameTypeItem.item_name,
            atk: props?.atk || 0,
            def: props?.def || 0,
          });
        } else {
          setEquippedItem(null);
        }
      } else {
        setEquippedItem(null);
      }
    } catch (error) {
      console.error('Error loading equipped item:', error);
    }
  };

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
            price: item.price, // Save original price for selling
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
      setIsPurchased(true);
      setTimeout(() => {
        setIsPurchased(false);
        onBuySuccess?.();
        onClose();
      }, 1500);
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
      <DialogContent className="max-w-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          {isPurchased ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center justify-center py-12 gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <ShoppingCart className="w-10 h-10 text-green-500" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-bold text-green-500"
              >
                Compra Realizada!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground"
              >
                {item.name} foi adicionado ao seu inventário
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className={`text-2xl ${rarityClass.split(' ')[0]} flex items-center gap-2`}>
                  {item.rarity === 'legendary' && <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />}
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

              <div className="space-y-4 mt-4">
                {/* Stats */}
                <div className="flex gap-6">
                  {item.atk > 0 && (
                    <motion.div 
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                    >
                      <Sword className="w-5 h-5 text-red-400" />
                      <span className="text-lg font-bold text-red-400">+{item.atk} Ataque</span>
                    </motion.div>
                  )}
                  {item.def > 0 && (
                    <motion.div 
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Shield className="w-5 h-5 text-blue-400" />
                      <span className="text-lg font-bold text-blue-400">+{item.def} Defesa</span>
                    </motion.div>
                  )}
                </div>

                {/* Stat Comparison */}
                {(item.type === 'weapon' || item.type === 'armor') && (
                  <ShopStatComparison shopItem={item} equippedItem={equippedItem} />
                )}

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
                <motion.div 
                  className="flex items-center justify-between text-lg font-bold p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  <span>Preço:</span>
                  <span className="flex items-center gap-2 text-yellow-500">
                    <Coins className="w-5 h-5" />
                    {item.price} 🪙
                  </span>
                </motion.div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleBuy} 
                  disabled={isLoading || (item.stock !== undefined && item.stock !== -1 && item.stock <= 0)}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Coins className="w-4 h-4" />
                    </motion.div>
                  ) : item.stock === 0 ? 'Sem Estoque' : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Comprar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
