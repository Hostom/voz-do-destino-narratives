import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShopItemCard } from "./ShopItemCard";
import { ShopItemModal } from "./ShopItemModal";
import { ShopSellPanel } from "./ShopSellPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, Search, Lock, TrendingUp } from "lucide-react";

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
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [campaignType, setCampaignType] = useState<string>("fantasy");
  const [availableShops, setAvailableShops] = useState<any[]>([]);

  useEffect(() => {
    loadRoomStage();
  }, [roomId]);

  const loadRoomStage = async () => {
    const { data: room } = await supabase
      .from('rooms')
      .select('story_stage, campaign_type')
      .eq('id', roomId)
      .single();
    
    if (room) {
      setCurrentStage(room.story_stage || 1);
      setCampaignType(room.campaign_type || 'fantasy');
      loadAvailableShops(room.story_stage || 1, room.campaign_type || 'fantasy');
    }
  };

  const loadAvailableShops = async (stage: number, campType: string) => {
    const { data: shops } = await supabase
      .from('shops')
      .select('id, name, description, shop_type, stage')
      .eq('campaign_type', campType)
      .order('shop_type')
      .order('stage');
    
    if (shops) {
      setAvailableShops(shops);
    }
  };

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
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Selecione uma loja para começar:</p>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Estágio {currentStage}
                </Badge>
              </div>
              
              <div className="space-y-6">
                {['blacksmith', 'jewelry', 'general', 'alchemist'].map((type) => {
                  const typeShops = availableShops.filter(s => s.shop_type === type);
                  const availableShop = typeShops
                    .filter(s => s.stage <= currentStage)
                    .sort((a, b) => b.stage - a.stage)[0];
                  const nextShop = typeShops.find(s => s.stage > currentStage);
                  
                  const typeIcons = {
                    blacksmith: '🔨',
                    jewelry: '💎',
                    general: '🏪',
                    alchemist: '⚗️'
                  };
                  
                  const typeNames = {
                    blacksmith: 'Ferreiro',
                    jewelry: 'Joalheria',
                    general: 'Mercado Geral',
                    alchemist: 'Alquimia'
                  };

                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeIcons[type as keyof typeof typeIcons]}</span>
                        <h3 className="font-semibold">{typeNames[type as keyof typeof typeNames]}</h3>
                      </div>
                      
                      {availableShop ? (
                        <Button
                          onClick={() => {
                            setShopType(type);
                            openShop(type);
                          }}
                          disabled={isLoading}
                          variant="outline"
                          className="w-full justify-start h-auto"
                        >
                          <div className="flex flex-col items-start w-full min-w-0 gap-1 py-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="font-medium truncate w-full text-left cursor-help">
                                    {availableShop.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{availableShop.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground line-clamp-2 text-left cursor-help w-full">
                                    {availableShop.description}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{availableShop.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </Button>
                      ) : (
                        <div className="w-full p-3 border border-dashed rounded-lg bg-muted/50 text-muted-foreground text-sm">
                          Nenhuma loja disponível neste estágio
                        </div>
                      )}
                      
                      {nextShop && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
                          <Lock className="w-3 h-3 flex-shrink-0" />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate cursor-help">
                                  Próxima: <strong>{nextShop.name}</strong> (Estágio {nextShop.stage})
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Próxima: {nextShop.name} (Estágio {nextShop.stage})</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold">{shopData.name}</h3>
                    <p className="text-sm text-muted-foreground">{shopData.description}</p>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Estágio {currentStage}
                  </Badge>
                </div>
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
