import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Coins, Package, Plus, Weight, Sword, Shield, Beaker, Sparkles, Grid3X3, List, Check, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ItemTradeOffer } from "./ItemTradeOffer";
import { Badge } from "@/components/ui/badge";
import { InventoryItemCard } from "./InventoryItemCard";
import { motion, AnimatePresence } from "framer-motion";

interface InventoryItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  weight: number;
  description: string | null;
  equipped: boolean;
  properties?: any;
}

interface Currency {
  copper_pieces: number;
  silver_pieces: number;
  electrum_pieces: number;
  gold_pieces: number;
  platinum_pieces: number;
}

interface InventoryPanelProps {
  characterId: string;
  carryingCapacity: number;
  roomId?: string;
  players?: Array<{ character_id: string; character_name: string }>;
}

export const InventoryPanel = ({ characterId, carryingCapacity, roomId, players = [] }: InventoryPanelProps) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [currency, setCurrency] = useState<Currency>({
    copper_pieces: 0,
    silver_pieces: 0,
    electrum_pieces: 0,
    gold_pieces: 0,
    platinum_pieces: 0,
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [newItem, setNewItem] = useState({
    item_name: "",
    item_type: "misc",
    quantity: 1,
    weight: 0,
    description: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadInventory();
    loadCurrency();

    const channel = supabase
      .channel(`inventory-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_items',
          filter: `character_id=eq.${characterId}`
        },
        () => {
          loadInventory();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`
        },
        () => {
          loadCurrency();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const loadInventory = async () => {
    const { data, error } = await supabase
      .from('character_items')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading inventory:', error);
      return;
    }

    setItems(data || []);
  };

  const loadCurrency = async () => {
    const { data, error } = await supabase
      .from('characters')
      .select('copper_pieces, silver_pieces, electrum_pieces, gold_pieces, platinum_pieces')
      .eq('id', characterId)
      .single();

    if (error) {
      console.error('Error loading currency:', error);
      return;
    }

    setCurrency(data);
  };

  const addItem = async () => {
    if (!newItem.item_name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do item é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('character_items')
      .insert({
        character_id: characterId,
        ...newItem,
      });

    if (error) {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Item adicionado!",
      description: `${newItem.item_name} foi adicionado ao inventário`,
    });

    setNewItem({
      item_name: "",
      item_type: "misc",
      quantity: 1,
      weight: 0,
      description: "",
    });
    setIsAddDialogOpen(false);
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('character_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Erro ao remover item",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Item removido",
      description: "Item foi removido do inventário",
    });
  };

  const toggleEquipItem = async (item: InventoryItem) => {
    try {
      const newEquippedState = !item.equipped;
      
      // Update item equipped state
      const { error: itemError } = await supabase
        .from("character_items")
        .update({ equipped: newEquippedState })
        .eq("id", item.id);

      if (itemError) throw itemError;

      // Get character data
      const { data: charData, error: charError } = await supabase
        .from("characters")
        .select("name, armor_class, equipped_weapon")
        .eq("id", characterId)
        .single();

      if (charError) throw charError;

      let updates: any = {};
      
      // Handle different item types
      if (item.item_type === "armor" || item.item_type === "armadura") {
        const defBonus = item.properties?.def || 0;
        updates.armor_class = newEquippedState 
          ? (charData.armor_class + defBonus)
          : (charData.armor_class - defBonus);
      } else if (item.item_type === "weapon" || item.item_type === "arma") {
        if (newEquippedState) {
          const atkBonus = item.properties?.atk || 0;
          updates.equipped_weapon = {
            id: item.id,
            name: item.item_name,
            damage_dice: item.properties?.damage_dice || "1d6",
            damage_type: item.properties?.damage_type || "cortante",
            ability: item.properties?.ability || "strength",
            atk_bonus: atkBonus
          };
        } else {
          updates.equipped_weapon = {
            name: "Ataque Desarmado",
            ability: "strength",
            damage_dice: "1d4",
            damage_type: "contundente"
          };
        }
      } else if (item.item_type === "shield" || item.item_type === "escudo") {
        const defBonus = item.properties?.def || 2;
        updates.armor_class = newEquippedState 
          ? (charData.armor_class + defBonus)
          : (charData.armor_class - defBonus);
      }

      // Update character if there are changes
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from("characters")
          .update(updates)
          .eq("id", characterId);

        if (updateError) throw updateError;
      }

      // Send GM message if in a room
      if (roomId) {
        const action = newEquippedState ? "equipou" : "desequipou";
        await supabase.from("gm_messages").insert({
          room_id: roomId,
          player_id: characterId,
          character_name: charData.name,
          sender: "system",
          type: "system",
          content: `${charData.name} ${action} ${item.item_name}`,
        });
      }

      toast({
        title: newEquippedState ? "Item equipado" : "Item desequipado",
        description: `${item.item_name} foi ${newEquippedState ? "equipado" : "desequipado"}`,
      });
    } catch (error) {
      console.error("Error toggling equip:", error);
      toast({
        title: "Erro",
        description: "Não foi possível equipar/desequipar o item",
        variant: "destructive",
      });
    }
  };

  const updateCurrency = async (field: keyof Currency, value: number) => {
    const { error } = await supabase
      .from('characters')
      .update({ [field]: Math.max(0, value) })
      .eq('id', characterId);

    if (error) {
      toast({
        title: "Erro ao atualizar moedas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const isOverencumbered = totalWeight > carryingCapacity;

  const itemTypeLabels: Record<string, string> = {
    weapon: "Arma",
    armor: "Armadura",
    potion: "Poção",
    magic_item: "Item Mágico",
    misc: "Diversos",
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currency */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Coins className="h-4 w-4" />
            Moedas
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground block text-center">PC</Label>
              <Input
                type="number"
                value={currency.copper_pieces}
                onChange={(e) => updateCurrency('copper_pieces', parseInt(e.target.value) || 0)}
                className="h-8 text-xs p-1 text-center"
                min="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground block text-center">PP</Label>
              <Input
                type="number"
                value={currency.silver_pieces}
                onChange={(e) => updateCurrency('silver_pieces', parseInt(e.target.value) || 0)}
                className="h-8 text-xs p-1 text-center"
                min="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground block text-center">PE</Label>
              <Input
                type="number"
                value={currency.electrum_pieces}
                onChange={(e) => updateCurrency('electrum_pieces', parseInt(e.target.value) || 0)}
                className="h-8 text-xs p-1 text-center"
                min="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground block text-center">PO</Label>
              <Input
                type="number"
                value={currency.gold_pieces}
                onChange={(e) => updateCurrency('gold_pieces', parseInt(e.target.value) || 0)}
                className="h-8 text-xs p-1 text-center"
                min="0"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground block text-center">PL</Label>
              <Input
                type="number"
                value={currency.platinum_pieces}
                onChange={(e) => updateCurrency('platinum_pieces', parseInt(e.target.value) || 0)}
                className="h-8 text-xs p-1 text-center"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Weight */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4" />
            <span>Peso Total:</span>
          </div>
          <span className={isOverencumbered ? "text-destructive font-semibold" : ""}>
            {totalWeight.toFixed(1)} / {carryingCapacity} lb
          </span>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {/* Header with controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold">Itens ({items.length})</span>
            <div className="flex items-center gap-2">
              {/* Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 text-xs w-[120px]">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="weapon">Armas</SelectItem>
                  <SelectItem value="armor">Armaduras</SelectItem>
                  <SelectItem value="potion">Poções</SelectItem>
                  <SelectItem value="magic_item">Mágicos</SelectItem>
                  <SelectItem value="misc">Diversos</SelectItem>
                </SelectContent>
              </Select>
              
              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                  className="h-8 px-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                  className="h-8 px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Add Button */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome do Item</Label>
                      <Input
                        value={newItem.item_name}
                        onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                        placeholder="Ex: Poção de Cura"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={newItem.item_type}
                        onValueChange={(value) => setNewItem({ ...newItem, item_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weapon">Arma</SelectItem>
                          <SelectItem value="armor">Armadura</SelectItem>
                          <SelectItem value="potion">Poção</SelectItem>
                          <SelectItem value="magic_item">Item Mágico</SelectItem>
                          <SelectItem value="misc">Diversos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Peso (lb)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={newItem.weight}
                          onChange={(e) => setNewItem({ ...newItem, weight: parseFloat(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        placeholder="Descrição do item..."
                        rows={3}
                      />
                    </div>
                    <Button onClick={addItem} className="w-full">
                      Adicionar Item
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Items Grid/List */}
          <ScrollArea className="h-[350px]">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Nenhum item no inventário</p>
                <p className="text-xs mt-1">Adicione itens para começar</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div 
                  className={viewMode === "grid" 
                    ? "grid grid-cols-1 md:grid-cols-2 gap-3 pr-4" 
                    : "space-y-2 pr-4"
                  }
                  layout
                >
                  {items
                    .filter(item => filterType === "all" || item.item_type === filterType || 
                      (filterType === "weapon" && ["weapon", "arma"].includes(item.item_type.toLowerCase())) ||
                      (filterType === "armor" && ["armor", "armadura", "shield", "escudo"].includes(item.item_type.toLowerCase())))
                    .map((item) => (
                      <InventoryItemCard
                        key={item.id}
                        item={item}
                        onEquip={() => toggleEquipItem(item)}
                        onDelete={() => deleteItem(item.id)}
                        onTrade={roomId && players.length > 1 ? () => {} : undefined}
                        canEquip={["weapon", "arma", "armor", "armadura", "shield", "escudo"].includes(item.item_type.toLowerCase())}
                        canTrade={Boolean(roomId && players.length > 1)}
                      />
                    ))}
                </motion.div>
              </AnimatePresence>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
