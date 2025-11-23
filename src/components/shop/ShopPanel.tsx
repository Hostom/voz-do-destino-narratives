import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShopItemCard } from "./ShopItemCard";
import { ShopItemModal } from "./ShopItemModal";
import { ShopSellPanel } from "./ShopSellPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, Search } from "lucide-react";

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
}

interface ShopData {
  shopId: string;
  name: string;
  description: string;
  items: ShopItem[];
}

interface ShopPanelProps {
  roomId: string;
  characterId: string;
}

export function ShopPanel({ roomId, characterId }: ShopPanelProps) {
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [shopType, setShopType] = useState<string>("blacksmith");

  const openShop = async (type: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('open-shop', {
        body: { roomId, shopType: type }
      });

      if (error) throw error;

      setShopData(data);
      toast.success(`${data.name} aberta!`);
    } catch (error: any) {
      console.error('Error opening shop:', error);
      toast.error(error.message || 'Erro ao abrir loja');
      setShopData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemClick = (item: ShopItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleBuySuccess = () => {
    // Refresh shop data to update stock if needed
    if (shopData) {
      openShop(shopType);
    }
  };

  // Filter items based on search and rarity
  const filteredItems = shopData?.items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = rarityFilter === "all" || item.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  }) || [];

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Sistema de Lojas
          </CardTitle>
          <CardDescription>
            Compre e venda itens. Os itens disponíveis dependem do estágio da campanha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!shopData ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Selecione uma loja para começar:</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    setShopType("blacksmith");
                    openShop("blacksmith");
                  }}
                  disabled={isLoading}
                  variant="outline"
                >
                  🔨 Ferreiro
                </Button>
                <Button
                  onClick={() => {
                    setShopType("jewelry");
                    openShop("jewelry");
                  }}
                  disabled={isLoading}
                  variant="outline"
                >
                  💎 Joalheria
                </Button>
                <Button
                  onClick={() => {
                    setShopType("general");
                    openShop("general");
                  }}
                  disabled={isLoading}
                  variant="outline"
                >
                  🏪 Mercado Geral
                </Button>
                <Button
                  onClick={() => {
                    setShopType("alchemist");
                    openShop("alchemist");
                  }}
                  disabled={isLoading}
                  variant="outline"
                >
                  ⚗️ Alquimia
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-xl font-semibold">{shopData.name}</h3>
                <p className="text-sm text-muted-foreground">{shopData.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShopData(null)}
                  className="mt-2"
                >
                  ← Voltar para seleção de lojas
                </Button>
              </div>

              <Tabs defaultValue="buy">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy">Comprar</TabsTrigger>
                  <TabsTrigger value="sell">Vender</TabsTrigger>
                </TabsList>

                <TabsContent value="buy" className="space-y-4">
                  {/* Filters */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar itens..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={rarityFilter} onValueChange={setRarityFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas Raridades</SelectItem>
                        <SelectItem value="common">Comum</SelectItem>
                        <SelectItem value="uncommon">Incomum</SelectItem>
                        <SelectItem value="rare">Raro</SelectItem>
                        <SelectItem value="very_rare">Muito Raro</SelectItem>
                        <SelectItem value="legendary">Lendário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Items Grid */}
                  <ScrollArea className="h-[450px]">
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum item encontrado
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
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
                </TabsContent>

                <TabsContent value="sell">
                  <ShopSellPanel characterId={characterId} roomId={roomId} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>

      {selectedItem && (
        <ShopItemModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          characterId={characterId}
          roomId={roomId}
          onBuySuccess={handleBuySuccess}
        />
      )}
    </>
  );
}
