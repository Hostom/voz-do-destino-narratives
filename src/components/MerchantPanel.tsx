import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Coins, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MerchantItem {
  id: string;
  item_name: string;
  item_type: string;
  description: string;
  current_price: number;
  stock: number;
  weight: number;
  rarity: string;
}

interface InventoryItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  weight: number;
}

interface MerchantPanelProps {
  characterId: string;
  roomId: string;
  goldPieces: number;
  charisma: number;
  onGoldChange: () => void;
}

export function MerchantPanel({ characterId, roomId, goldPieces, charisma, onGoldChange }: MerchantPanelProps) {
  const { toast } = useToast();
  const [merchantItems, setMerchantItems] = useState<MerchantItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedQuantity, setSelectedQuantity] = useState<Record<string, number>>({});
  const [merchantActive, setMerchantActive] = useState(false);
  const [bargainDiscounts, setBargainDiscounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadMerchantStatus();
    loadMerchantItems();
    loadInventory();
    loadBargains();

    const channel = supabase
      .channel(`merchant-status-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.merchant_active !== merchantActive) {
            setMerchantActive(newData.merchant_active);
            if (newData.merchant_active) {
              toast({
                title: "🏪 Mercador Disponível!",
                description: "O mercador está agora aberto para negócios",
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'merchant_items',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          loadMerchantItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, characterId]);

  const loadMerchantStatus = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("merchant_active")
      .eq("id", roomId)
      .single();

    if (data) {
      setMerchantActive(data.merchant_active);
    }
  };

  const loadMerchantItems = async () => {
    const { data } = await supabase
      .from("merchant_items")
      .select("*")
      .eq("room_id", roomId)
      .order("rarity", { ascending: false });

    if (data) {
      setMerchantItems(data);
    }
  };

  const loadInventory = async () => {
    const { data } = await supabase
      .from("character_items")
      .select("id, item_name, item_type, quantity, weight")
      .eq("character_id", characterId);

    if (data) {
      setInventory(data);
    }
  };

  const loadBargains = async () => {
    const { data } = await supabase
      .from("merchant_bargains")
      .select("merchant_item_id, discount_percent")
      .eq("character_id", characterId)
      .eq("room_id", roomId);

    if (data) {
      const discounts: Record<string, number> = {};
      data.forEach((bargain) => {
        discounts[bargain.merchant_item_id] = bargain.discount_percent;
      });
      setBargainDiscounts(discounts);
    }
  };

  const handleBargain = async (item: MerchantItem) => {
    // Check if already bargained
    if (bargainDiscounts[item.id] !== undefined) {
      toast({
        title: "Já negociado",
        description: "Você já tentou barganhar este item",
        variant: "destructive",
      });
      return;
    }

    // Roll Charisma check (Persuasion)
    const charismaModifier = Math.floor((charisma - 10) / 2);
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + charismaModifier;

    // DC based on item rarity
    const dcMap: Record<string, number> = {
      common: 10,
      uncommon: 13,
      rare: 15,
      very_rare: 18,
      legendary: 20,
    };
    const dc = dcMap[item.rarity] || 12;

    // Calculate discount based on how much they beat the DC
    let discountPercent = 0;
    const success = total >= dc;
    
    if (success) {
      const margin = total - dc;
      if (margin >= 10) discountPercent = 25; // Critical success
      else if (margin >= 5) discountPercent = 15;
      else discountPercent = 10;
    }

    try {
      // Save bargain attempt
      const { error } = await supabase
        .from("merchant_bargains")
        .insert({
          room_id: roomId,
          character_id: characterId,
          merchant_item_id: item.id,
          roll_result: roll,
          modifier: charismaModifier,
          total: total,
          discount_percent: discountPercent,
          success: success,
        });

      if (error) throw error;

      // Update local state
      setBargainDiscounts({ ...bargainDiscounts, [item.id]: discountPercent });

      // Show result
      if (success) {
        toast({
          title: `🎲 Negociação bem-sucedida!`,
          description: `Rolou ${roll} + ${charismaModifier} = ${total} (DC ${dc})\nDesconto de ${discountPercent}% conquistado!`,
          duration: 5000,
        });
      } else {
        toast({
          title: "❌ Negociação falhou",
          description: `Rolou ${roll} + ${charismaModifier} = ${total} (DC ${dc})\nO mercador não aceita sua oferta.`,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error bargaining:", error);
      toast({
        title: "Erro",
        description: "Não foi possível negociar",
        variant: "destructive",
      });
    }
  };

  const getDiscountedPrice = (itemId: string, basePrice: number): number => {
    const discount = bargainDiscounts[itemId] || 0;
    return Math.floor(basePrice * (1 - discount / 100));
  };

  const handleBuy = async (item: MerchantItem) => {
    const quantity = selectedQuantity[item.id] || 1;
    const discountedPrice = getDiscountedPrice(item.id, item.current_price);
    const totalCost = discountedPrice * quantity;

    if (goldPieces < totalCost) {
      toast({
        title: "Ouro insuficiente",
        description: `Você precisa de ${totalCost} PO para comprar isto`,
        variant: "destructive",
      });
      return;
    }

    if (item.stock !== -1 && item.stock < quantity) {
      toast({
        title: "Estoque insuficiente",
        description: "O mercador não possui esta quantidade em estoque",
        variant: "destructive",
      });
      return;
    }

    try {
      // Deduct gold
      const { error: goldError } = await supabase
        .from("characters")
        .update({ gold_pieces: goldPieces - totalCost })
        .eq("id", characterId);

      if (goldError) throw goldError;

      // Update merchant stock
      if (item.stock !== -1) {
        await supabase
          .from("merchant_items")
          .update({ stock: item.stock - quantity })
          .eq("id", item.id);
      }

      // Add item to inventory
      const existing = inventory.find((inv) => inv.item_name === item.item_name);
      if (existing) {
        await supabase
          .from("character_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
      } else {
        await supabase.from("character_items").insert({
          character_id: characterId,
          item_name: item.item_name,
          item_type: item.item_type,
          quantity: quantity,
          weight: item.weight,
          description: item.description,
        });
      }

      // Record transaction
      await supabase.from("merchant_transactions").insert({
        room_id: roomId,
        character_id: characterId,
        merchant_item_id: item.id,
        item_name: item.item_name,
        transaction_type: "buy",
        price: totalCost,
        quantity: quantity,
      });

      toast({
        title: "✅ Compra realizada!",
        description: `Você comprou ${item.item_name} x${quantity} por ${totalCost} PO`,
      });

      loadMerchantItems();
      loadInventory();
      onGoldChange();
      setSelectedQuantity({ ...selectedQuantity, [item.id]: 1 });
    } catch (error) {
      console.error("Error buying item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível completar a compra",
        variant: "destructive",
      });
    }
  };

  const handleSell = async (item: InventoryItem) => {
    const quantity = selectedQuantity[item.id] || 1;
    
    if (item.quantity < quantity) {
      toast({
        title: "Quantidade inválida",
        description: "Você não possui esta quantidade",
        variant: "destructive",
      });
      return;
    }

    // Sell price is 50% of item value (estimated from rarity)
    const baseValue = 10; // Common items worth 10 gold
    const sellPrice = Math.floor(baseValue * quantity * 0.5);

    try {
      // Add gold
      const { error: goldError } = await supabase
        .from("characters")
        .update({ gold_pieces: goldPieces + sellPrice })
        .eq("id", characterId);

      if (goldError) throw goldError;

      // Remove item from inventory
      if (item.quantity === quantity) {
        await supabase.from("character_items").delete().eq("id", item.id);
      } else {
        await supabase
          .from("character_items")
          .update({ quantity: item.quantity - quantity })
          .eq("id", item.id);
      }

      // Record transaction
      await supabase.from("merchant_transactions").insert({
        room_id: roomId,
        character_id: characterId,
        item_name: item.item_name,
        transaction_type: "sell",
        price: sellPrice,
        quantity: quantity,
      });

      toast({
        title: "✅ Venda realizada!",
        description: `Você vendeu ${item.item_name} x${quantity} por ${sellPrice} PO`,
      });

      loadInventory();
      onGoldChange();
      setSelectedQuantity({ ...selectedQuantity, [item.id]: 1 });
    } catch (error) {
      console.error("Error selling item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível completar a venda",
        variant: "destructive",
      });
    }
  };

  const rarityColors: Record<string, string> = {
    common: "bg-gray-500",
    uncommon: "bg-green-500",
    rare: "bg-blue-500",
    very_rare: "bg-purple-500",
    legendary: "bg-amber-500",
  };

  if (!merchantActive) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Mercador não disponível</p>
            <p className="text-xs mt-1">
              Aguarde o GM abrir a loja ou peça para visitar um mercador
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Mercador Itinerante
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Coins className="h-4 w-4" />
          <span>Seu ouro: {goldPieces} PO</span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Comprar</TabsTrigger>
            <TabsTrigger value="sell">Vender</TabsTrigger>
          </TabsList>

          <TabsContent value="buy">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {merchantItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    O mercador não possui itens no momento
                  </p>
                ) : (
                  merchantItems.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{item.item_name}</h4>
                              <Badge className={rarityColors[item.rarity]}>
                                {item.rarity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                          <div className="text-right">
                            {bargainDiscounts[item.id] !== undefined && bargainDiscounts[item.id] > 0 ? (
                              <>
                                <p className="text-xs text-muted-foreground line-through">
                                  {item.current_price} PO
                                </p>
                                <p className="font-bold text-green-500">
                                  {getDiscountedPrice(item.id, item.current_price)} PO
                                </p>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  -{bargainDiscounts[item.id]}%
                                </Badge>
                              </>
                            ) : (
                              <p className="font-bold text-amber-500">{item.current_price} PO</p>
                            )}
                            {item.stock !== -1 && (
                              <p className="text-xs text-muted-foreground">
                                Estoque: {item.stock}
                              </p>
                            )}
                          </div>
                        </div>

                        {bargainDiscounts[item.id] === undefined && (
                          <Button
                            onClick={() => handleBargain(item)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            💬 Tentar Negociar (Carisma)
                          </Button>
                        )}

                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="1"
                            max={item.stock !== -1 ? item.stock : 99}
                            value={selectedQuantity[item.id] || 1}
                            onChange={(e) =>
                              setSelectedQuantity({
                                ...selectedQuantity,
                                [item.id]: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-20"
                          />
                          <Button
                            onClick={() => handleBuy(item)}
                            disabled={
                              goldPieces < getDiscountedPrice(item.id, item.current_price) * (selectedQuantity[item.id] || 1) ||
                              (item.stock !== -1 && item.stock === 0)
                            }
                            className="flex-1"
                            size="sm"
                          >
                            Comprar ({getDiscountedPrice(item.id, item.current_price) * (selectedQuantity[item.id] || 1)} PO)
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sell">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {inventory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Você não possui itens para vender
                  </p>
                ) : (
                  inventory.map((item) => {
                    const sellPrice = Math.floor(10 * (selectedQuantity[item.id] || 1) * 0.5);
                    return (
                      <Card key={item.id} className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-sm">{item.item_name}</h4>
                              <p className="text-xs text-muted-foreground">
                                Quantidade: {item.quantity}
                              </p>
                            </div>
                            <p className="font-bold text-green-500">{sellPrice} PO</p>
                          </div>

                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="1"
                              max={item.quantity}
                              value={selectedQuantity[item.id] || 1}
                              onChange={(e) =>
                                setSelectedQuantity({
                                  ...selectedQuantity,
                                  [item.id]: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-20"
                            />
                            <Button
                              onClick={() => handleSell(item)}
                              variant="outline"
                              className="flex-1"
                              size="sm"
                            >
                              Vender ({sellPrice} PO)
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
