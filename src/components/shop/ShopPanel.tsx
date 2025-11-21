import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Store, Search, Filter } from "lucide-react";
import { ShopItemCard } from "./ShopItemCard";
import { ShopItemModal } from "./ShopItemModal";
import { ShopState, ShopItem, Rarity, Quality, Personality, calculateFinalPrice } from "@/lib/shop-pricing";
import { Badge } from "@/components/ui/badge";

interface ShopPanelProps {
  roomId: string;
}

export const ShopPanel = ({ roomId }: ShopPanelProps) => {
  const [shopState, setShopState] = useState<ShopState | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // Load initial shop state from database
  useEffect(() => {
    if (!roomId) return;

    const loadShopState = async () => {
      const { data, error } = await supabase
        .from("shop_states")
        .select("*")
        .eq("room_id", roomId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading shop state:", error);
        return;
      }

      if (data) {
        // Recalculate final prices with current NPC modifiers
        const items = Array.isArray(data.items) ? data.items : [];
        const itemsWithPrices = items.map((item: any) => ({
          ...item,
          finalPrice: calculateFinalPrice(
            item.basePrice,
            item.rarity as Rarity,
            item.quality as Quality,
            data.npc_personality as Personality,
            data.npc_reputation
          ),
        }));
        
        setShopState({
          room_id: data.room_id,
          npc_name: data.npc_name,
          npc_personality: data.npc_personality as Personality,
          npc_reputation: data.npc_reputation,
          items: itemsWithPrices,
          updated_at: data.updated_at,
        });
      }
    };

    loadShopState();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`room-shop:${roomId}`)
      .on(
        "broadcast",
        { event: "SHOP_UPDATE" },
        (payload) => {
          console.log("🛒 Shop update received:", payload);
          const shopData = payload.payload;
          
          // Recalculate final prices
          const items = Array.isArray(shopData.items) ? shopData.items : [];
          const itemsWithPrices = items.map((item: any) => ({
            ...item,
            finalPrice: calculateFinalPrice(
              item.basePrice,
              item.rarity as Rarity,
              item.quality as Quality,
              shopData.npcPersonality as Personality,
              shopData.npcReputation
            ),
          }));
          
          setShopState({
            room_id: shopData.roomId,
            npc_name: shopData.npcName,
            npc_personality: shopData.npcPersonality as Personality,
            npc_reputation: shopData.npcReputation,
            items: itemsWithPrices,
            updated_at: shopData.updatedAt,
          });
        }
      )
      .subscribe();

    // Also subscribe to database changes
    const dbChannel = supabase
      .channel(`shop-states-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shop_states",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log("🛒 Shop state changed in DB:", payload);
          if (payload.new) {
            const data = payload.new as any;
            const items = Array.isArray(data.items) ? data.items : [];
            const itemsWithPrices = items.map((item: any) => ({
              ...item,
              finalPrice: calculateFinalPrice(
                item.basePrice,
                item.rarity as Rarity,
                item.quality as Quality,
                data.npc_personality as Personality,
                data.npc_reputation
              ),
            }));
            
            setShopState({
              room_id: data.room_id,
              npc_name: data.npc_name,
              npc_personality: data.npc_personality as Personality,
              npc_reputation: data.npc_reputation,
              items: itemsWithPrices,
              updated_at: data.updated_at,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(dbChannel);
    };
  }, [roomId]);

  const handleItemClick = (item: ShopItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Filter items
  const filteredItems = shopState?.items.filter((item) => {
    // Search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Rarity filter
    if (rarityFilter !== "all" && item.rarity !== rarityFilter) {
      return false;
    }

    // Price filter
    if (priceMin && item.finalPrice < parseInt(priceMin)) {
      return false;
    }
    if (priceMax && item.finalPrice > parseInt(priceMax)) {
      return false;
    }

    return true;
  }) || [];

  if (!shopState) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Loja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>Nenhuma loja disponível no momento.</p>
            <p className="text-sm mt-2">Aguarde o Mestre abrir uma loja na narrativa.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {shopState.npc_name}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {shopState.npc_personality === "friendly" && "Amigável"}
              {shopState.npc_personality === "neutral" && "Neutro"}
              {shopState.npc_personality === "hostile" && "Hostil"}
            </Badge>
            {shopState.npc_reputation !== 0 && (
              <Badge variant="secondary">
                Reputação: {shopState.npc_reputation > 0 ? "+" : ""}{shopState.npc_reputation}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar itens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Select value={rarityFilter} onValueChange={(value) => setRarityFilter(value as Rarity | "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Raridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="common">Comum</SelectItem>
                  <SelectItem value="uncommon">Incomum</SelectItem>
                  <SelectItem value="rare">Raro</SelectItem>
                  <SelectItem value="epic">Épico</SelectItem>
                  <SelectItem value="legendary">Lendário</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                placeholder="Min PO"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
              
              <Input
                type="number"
                placeholder="Max PO"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
          </div>

          {/* Items Grid */}
          <ScrollArea className="flex-1">
            {filteredItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Nenhum item encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredItems.map((item) => (
                  <ShopItemCard
                    key={item.id}
                    item={item}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <ShopItemModal
        item={selectedItem}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};

